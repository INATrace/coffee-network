package main

import (
	"encoding/json"
	"fmt"
	"math"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract - generic smart contract interface
type SmartContract struct {
	contractapi.Contract
}

// ForeignKeyScheme - schema for foreign key description
type ForeignKeyScheme struct {
	Field    string
	DocType  string
	Required bool
	IsArray  bool
}

// UniqueKeyScheme - schema for unique key description
type UniqueKeyScheme struct {
	Fields   []string
	Required bool
}

// JoinKeyScheme - schema for join key description
// specifies an index with prefix Name and relates the field Key to field Value
type JoinKeyScheme struct {
	Name  string // index name
	Key   string // field name representing the key
	Value string // field name representing the value
}

// GetState - returns a state for a key
func (s *SmartContract) GetState(ctx contractapi.TransactionContextInterface, key string) (string, error) {
	state, err := ctx.GetStub().GetState(key)
	if err != nil {
		return "", fmt.Errorf("Failed to read state. %s", err.Error())
	}
	processedState := strings.Replace(string(state), "\\n", "\n", -1)
	return processedState, nil
}

func getStateMap(ctx contractapi.TransactionContextInterface, key string, data *map[string]interface{}) (bool, error) {
	state, err := ctx.GetStub().GetState(key)
	if err != nil {
		return false, fmt.Errorf("getStateMap::Failed to read state. %s", err.Error())
	}
	if len(state) == 0 {
		return false, nil
	}
	err = json.Unmarshal([]byte(state), &data)
	if err == nil {
		return true, nil
	}
	return false, err
}

func getExistentStateMap(ctx contractapi.TransactionContextInterface, key string) (map[string]interface{}, error) {
	var data map[string]interface{}
	exists, err := getStateMap(ctx, key, &data)
	if err != nil {
		return nil, err
	}
	if !exists {
		return nil, fmt.Errorf("State %v does not exist", key)
	}
	return data, nil
}

func getStateMaps(ctx contractapi.TransactionContextInterface, keys []string) ([]map[string]interface{}, error) {
	result := make([]map[string]interface{}, len(keys))
	for index, key := range keys {
		var data map[string]interface{}
		exists, err := getStateMap(ctx, key, &data)
		if err != nil {
			return nil, err
		}
		if exists {
			result[index] = data
		}
	}
	return result, nil
}

// GetStateJson - experimental
// func (s *SmartContract) GetStateJson(ctx contractapi.TransactionContextInterface, key string) (string, error) {
// 	state, err := ctx.GetStub().GetState(key)

// 	fmt.Println("GET read.	", state)
// 	var result map[string]interface{}

// 	err = json.Unmarshal([]byte(state), &result)

// 	if err != nil {
// 		return "", fmt.Errorf("Failed to read state. %s", err.Error())
// 	}

// 	fmt.Println("Unmarshaled:", result)
// 	return string(state), nil
// }

// PutState - puts the JSON state serialized in the string to the blockchain
func (s *SmartContract) PutState(ctx contractapi.TransactionContextInterface, key string, state string) error {
	return ctx.GetStub().PutState(key, []byte(state))
}

// DelState - deletes the state for ky
func (s *SmartContract) DelState(ctx contractapi.TransactionContextInterface, key string) error {
	return ctx.GetStub().DelState(key)
}

func clearUnderscoreKeys(m *map[string]interface{}) {
	for k := range *m {
		if strings.HasPrefix(k, "_") {
			delete(*m, k)
		}
	}
}

// generates dbKey from _id, if not defined or throws error
func adjustKeys(m *map[string]interface{}) error {
	dbKeyRaw := (*m)["dbKey"]
	if dbKeyRaw != nil {
		dbKey := dbKeyRaw.(string)
		if dbKey != "" {
			return nil
		}
	}
	dbIDRaw := (*m)["_id"]
	if dbIDRaw == nil {
		return fmt.Errorf("No 'dbKey' or '_id' in object to be inserted/updated")
	}
	dbID := dbIDRaw.(string)
	(*m)["dbKey"] = dbID
	return nil
}

// clears the fields from list before save
func clearOnSave(m *map[string]interface{}, clr *[]string) {
	for _, field := range *clr {
		delete(*m, field)
	}
}

// JSON pretty print for debugging purposes
func jsonPrettyPrint(prefix string, m map[string]interface{}) {
	pretty, _ := json.MarshalIndent(&m, "", "    ")
	fmt.Println(prefix, string(pretty))
}

// verifies consistency of a foreign key or returns error
func checkParticularForeignKey(ctx contractapi.TransactionContextInterface, key string, element ForeignKeyScheme) error {
	fmt.Println("CHECK PATICULAR:", key, element)
	state, err := ctx.GetStub().GetState(key)
	if err != nil {
		return fmt.Errorf("Error while getting foreign key for '%s' by reference %s", element.Field, key)
	}

	if len(state) == 0 {
		if element.Required {
			return fmt.Errorf("No object for referenced key %s in field '%s'", key, element.Field)
		}
	}

	var value map[string]interface{}
	err = json.Unmarshal([]byte(state), &value)
	if err != nil {
		return fmt.Errorf("Cannot unmarshal target object for field '%s': %s", element.Field, err)
	}
	docType, ok := value["docType"]
	if !ok {
		return fmt.Errorf("Object on key '%s' key does not have a valid 'docType' field", key)
	}
	if element.DocType != "" && docType != element.DocType {
		return fmt.Errorf("Target docType '%s' does not match to the required docType '%s'", docType, element.DocType)
	}
	return nil
}

// verifies consistency of all foreign keys, according to the foreign key schemes
func checkForeignKeys(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, foreignKeys *[]ForeignKeyScheme) error {
	for _, element := range *foreignKeys {
		if !element.IsArray {
			fmt.Println("FC KEY:", element.Field)
			keyRaw := (*m)[element.Field]
			if keyRaw == nil {
				if element.Required {
					return fmt.Errorf("Key '%s' is required", element.Field)
				}
				continue
			}
			key := keyRaw.(string)
			fmt.Println("FC CHECKING", element.Field, key, element)
			err := checkParticularForeignKey(ctx, key, element)
			if err != nil {
				return err
			}
		} else { // array of foreign keys
			keysRaw := (*m)[element.Field]
			if keysRaw == nil {
				if element.Required {
					return fmt.Errorf("Key '%s' is required", element.Field)
				}
				continue
			}
			keys := keysRaw.([]interface{})
			for _, oneKey := range keys {
				aKey := oneKey.(string)
				err := checkParticularForeignKey(ctx, aKey, element)
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func checkUniqueKeys(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKeys *[]UniqueKeyScheme) error {
	dbKey := (*m)["dbKey"]
	for _, uniqueKey := range *uniqueKeys {
		key, err := getIndexUnique(ctx, m, &uniqueKey)
		if err != nil {
			return err
		}
		if key != "" && (dbKey == nil || key != dbKey.(string)) {
			return fmt.Errorf("A key or a combination of keys is not unique")
		}
	}
	return nil
}

func removeForeignKeysRefsFromIndex(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, foreignKeys *[]ForeignKeyScheme) error {
	myKey := (*m)["dbKey"].(string)
	for _, element := range *foreignKeys {
		if !element.IsArray {

			keyRaw := (*m)[element.Field]
			if keyRaw == nil {
				continue
			}
			key := keyRaw.(string)
			err := deleteCompositeIndexEntry(ctx, "ref", []string{key, myKey})
			if err != nil {
				return err
			}
		} else { // array of foreign keys
			keysRaw := (*m)[element.Field]
			if keysRaw == nil {
				continue
			}
			keys := keysRaw.([]interface{})
			for _, oneKey := range keys {
				key := oneKey.(string)
				err := deleteCompositeIndexEntry(ctx, "ref", []string{key, myKey})
				if err != nil {
					return err
				}
			}
		}
	}
	return nil
}

func removeUniqueKeysRefsFromIndex(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKeys *[]UniqueKeyScheme) error {
	for _, uniqueKey := range *uniqueKeys {
		err := deleteIndexUnique(ctx, m, &uniqueKey)
		if err != nil {
			return err
		}
	}
	return nil
}

func removeJoinKeysRefsFromIndex(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, joinKeys *[]JoinKeyScheme) error {
	for _, joinKey := range *joinKeys {
		err := deleteIndexJoin(ctx, m, &joinKey)
		if err != nil {
			return err
		}
	}
	return nil
}

// performs several verifications and fixes of the object before saving (foreign keys, dbKey, deletes underscore fields and fields to be deleted before save)
func checkIfCanInsert(ctx contractapi.TransactionContextInterface, mode string, data *map[string]interface{}, foreignKeys *[]ForeignKeyScheme, uniqueKeys *[]UniqueKeyScheme, fieldsToCleanOnSave *[]string) error {
	if foreignKeys != nil {
		err := checkForeignKeys(ctx, data, foreignKeys)
		if err != nil {
			return err
		}
	}
	err := adjustKeys(data)
	if err != nil {
		return err
	}
	clearUnderscoreKeys(data)
	if uniqueKeys != nil {
		err := checkUniqueKeys(ctx, data, uniqueKeys)
		if err != nil {
			return err
		}
	}
	if fieldsToCleanOnSave != nil {
		clearOnSave(data, fieldsToCleanOnSave)
	}
	return nil
}

// fixes initial JSON (newline character) and verifies the existence of the field 'docType'
func verifyAndFixJSON(state string, data *map[string]interface{}) error {
	processedState := strings.Replace(state, "\n", "\\n", -1)
	err := json.Unmarshal([]byte(processedState), data)
	if err != nil {
		return err
	}
	docType, err := extractStringValue(*data, "docType")
	if err != nil {
		return err
	}
	if docType == "" {
		return fmt.Errorf("Field 'docType' is empty")
	}
	if docType == "" {
		return fmt.Errorf("Field 'docType' must be non empty string")
	}
	return nil
}

// inserts the state data from a map obtained from JSON
func insertData(ctx contractapi.TransactionContextInterface, data *map[string]interface{}) error {
	key := (*data)["dbKey"].(string)
	popravljeno, _ := json.Marshal(*data)
	return ctx.GetStub().PutState(key, []byte(popravljeno))
}

// aux function to extract string value from a JSON generated map
func extractStringValue(data map[string]interface{}, key string) (string, error) {
	raw := data[key]
	if raw == nil {
		return "", fmt.Errorf("No '%s' field", key)
	}
	value := raw.(string)
	return value, nil
}

// aux function to extract int value from a JSON generated map
func extractIntValue(data map[string]interface{}, key string) (int, error) {
	raw := data[key]
	if raw == nil {
		return 0, fmt.Errorf("No '%s' field", key)
	}
	value := int(raw.(float64))
	return value, nil
}

func extractFloatValue(data map[string]interface{}, key string) (float64, error) {
	raw := data[key]
	if raw == nil {
		return 0, fmt.Errorf("No '%s' field", key)
	}
	value := raw.(float64)
	return value, nil
}

func extractBoolValue(data map[string]interface{}, key string) (bool, error) {
	raw := data[key]
	if raw == nil {
		return false, fmt.Errorf("No '%s' field", key)
	}
	value := raw.(bool)
	return value, nil
}

func extractOrGenerateDbKey(data *map[string]interface{}) (string, error) {
	var dbKey string
	if (*data)["dbKey"] == nil {
		dbKey = "" // TODO: generate uuid
		(*data)["dbKey"] = dbKey
		return "", fmt.Errorf("dbKey generation not implemented") // TODO: remove
	} else {
		dbKey := (*data)["dbKey"].(string)
		if dbKey == "" {
			return "", fmt.Errorf("Empty db key")
		}
	}
	return dbKey, nil
}

func keyExists(data map[string]interface{}, key string) bool {
	return data[key] != nil && data[key].(string) != ""
}

func transcribeKey(data *map[string]interface{}, keyField string, objectField string) error {
	var key string
	if (*data)[keyField] != nil {
		key = (*data)[keyField].(string)
	}

	var objectKey string
	if (*data)[objectField] != nil {
		object := (*data)[objectField].(map[string]interface{})
		if object != nil && object["dbKey"] != nil {
			objectKey = object["dbKey"].(string)
		}
	}

	if key != "" && objectKey != "" && key != objectKey {
		return fmt.Errorf("Inconsistent reference key state")
	}

	if key == "" && objectKey != "" {
		(*data)[keyField] = objectKey
	}

	return nil
}

////////////////////////////////
// INDEXES: general
///////////////////////////////

func deleteCompositeIndexEntry(ctx contractapi.TransactionContextInterface, indexName string, keys []string) error {
	key, err := ctx.GetStub().CreateCompositeKey(indexName, keys)
	if err != nil {
		return err
	}
	err = ctx.GetStub().DelState(key)
	return err
}

func deletePartialCompositeIndexEntries(ctx contractapi.TransactionContextInterface, indexName string, partialKeys []string) error {
	refIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(indexName, partialKeys)
	if err != nil {
		// return shim.Error(err.Error())
		return err
	}

	defer refIterator.Close()

	for refIterator.HasNext() {
		value, err := refIterator.Next()
		if err != nil {
			return err
			// return shim.Error(err.Error())
		}
		err = ctx.GetStub().DelState(value.Key)
		if err != nil {
			return err
		}
	}
	return nil
}

////////////////////////////////
// INDEX: (targetKey, originKey) - reference index
///////////////////////////////

// inserts a (targetKey, sourceKey) index entry simulated by composite key. Value is empty.
func insertIndexReference(ctx contractapi.TransactionContextInterface, sourceKey string, targetKey string) error {
	if sourceKey == "" {
		return fmt.Errorf("sourceKey must be non-empty")
	}
	if targetKey == "" {
		return fmt.Errorf("targetKey must be non-empty")
	}
	key, err := ctx.GetStub().CreateCompositeKey("ref", []string{targetKey, sourceKey})
	if err != nil {
		return err
	}
	fmt.Println("INSERTING INDEX:", key)
	return ctx.GetStub().PutState(key, []byte("ANY")) // content is irrelevant
}

// verifies whether targetKey has any reference on it
func isKeyReferenced(ctx contractapi.TransactionContextInterface, targetKey string) (bool, error) {
	refIterator, err := ctx.GetStub().GetStateByPartialCompositeKey("ref", []string{targetKey})
	if err != nil {
		// return shim.Error(err.Error())
		return false, err
	}

	defer refIterator.Close()
	if refIterator.HasNext() {
		return true, nil
	}
	return false, nil
}

////////////////////////////////
// UNIQUE KEY INDEX: (docType, uniqueKey fields and values) - unique index
///////////////////////////////

func createIndexUnique(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKey *UniqueKeyScheme) (string, error) {
	docType := (*m)["docType"].(string)
	attributes := []string{docType}
	for _, field := range uniqueKey.Fields {
		var key string
		if (*m)[field] != nil {
			key = fmt.Sprintf("%v", (*m)[field])
		}
		if key == "" {
			if uniqueKey.Required {
				return "", fmt.Errorf("field %v of %v must not be empty", field, docType)
			} else {
				return "", nil
			}
		} else {
			attributes = append(attributes, field)
			attributes = append(attributes, key)
		}
	}
	return ctx.GetStub().CreateCompositeKey("uni", attributes)
}

func getIndexUnique(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKey *UniqueKeyScheme) (string, error) {
	key, err := createIndexUnique(ctx, m, uniqueKey)
	if err != nil {
		return "", err
	}
	state, err := ctx.GetStub().GetState(key)
	if state == nil {
		return "", err
	}
	return string(state), nil
}

func compareIndexUnique(ctx contractapi.TransactionContextInterface, m1 *map[string]interface{}, m2 *map[string]interface{}, uniqueKey *UniqueKeyScheme) (bool, error) {
	key1, err := createIndexUnique(ctx, m1, uniqueKey)
	if err != nil {
		return false, err
	}
	if key1 == "" {
		return false, nil
	}
	key2, err := createIndexUnique(ctx, m2, uniqueKey)
	if err != nil {
		return false, err
	}
	return key1 == key2, nil
}

func insertIndexUnique(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKey *UniqueKeyScheme) error {
	key, err := createIndexUnique(ctx, m, uniqueKey)
	if err != nil {
		return err
	}
	if key != "" {
		fmt.Println("INSERTING INDEX:", key)
		return ctx.GetStub().PutState(key, []byte((*m)["dbKey"].(string)))
	}
	return nil

}

func deleteIndexUnique(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, uniqueKey *UniqueKeyScheme) error {
	key, err := createIndexUnique(ctx, m, uniqueKey)
	if err != nil {
		return err
	}
	if key != "" {
		fmt.Println("DELETING INDEX:", key)
		return ctx.GetStub().DelState(key)
	}
	return nil
}

////////////////////////////////
// JOIN KEY INDEX: (refKey, docType -> value) - join index
///////////////////////////////

func createIndexJoin(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, joinKey *JoinKeyScheme) (string, error) {
	dbKey := (*m)["dbKey"].(string)
	refKey := (*m)[joinKey.Key].(string)
	return ctx.GetStub().CreateCompositeKey(joinKey.Name, []string{refKey, dbKey})
}

func insertIndexJoin(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, joinKey *JoinKeyScheme) error {
	key, err := createIndexJoin(ctx, m, joinKey)
	if err != nil {
		return err
	}
	var value []byte
	if joinKey.Value != "" {
		value, err = json.Marshal(map[string]interface{}{"value": (*m)[joinKey.Value]})
		if err != nil {
			return err
		}
	}
	fmt.Println("INSERTING INDEX:", key)
	return ctx.GetStub().PutState(key, value)
}

func deleteIndexJoin(ctx contractapi.TransactionContextInterface, m *map[string]interface{}, joinKey *JoinKeyScheme) error {
	key, err := createIndexJoin(ctx, m, joinKey)
	if err != nil {
		return err
	}
	fmt.Println("DELETING INDEX:", key)
	return ctx.GetStub().DelState(key)
}

func getPointersIndexJoin(ctx contractapi.TransactionContextInterface, index string, key string) ([]string, error) {
	result := make([]string, 0)
	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey(index, []string{key})
	if err != nil {
		return nil, err
	}

	defer iterator.Close()

	for iterator.HasNext() {
		item, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		_, attributes, err := ctx.GetStub().SplitCompositeKey(item.Key)
		if err != nil {
			return nil, err
		}
		result = append(result, attributes[1])
	}

	return result, nil
}

func aggregateIndexJoin(ctx contractapi.TransactionContextInterface, index string, key string, reduce func(*interface{}, interface{})) (interface{}, error) {
	var result interface{}
	iterator, err := ctx.GetStub().GetStateByPartialCompositeKey(index, []string{key})
	if err != nil {
		return nil, err
	}

	defer iterator.Close()

	for iterator.HasNext() {
		item, err := iterator.Next()
		if err != nil {
			return nil, err
		}
		var jsonObj map[string]interface{}
		err = json.Unmarshal(item.Value, &jsonObj)
		if err != nil {
			return nil, err
		}
		value := jsonObj["value"]

		if result == nil {
			result = value
		} else {
			reduce(&result, value)
		}
	}

	return result, nil
}

// GetIndexKeyList - lists index keys
func (s *SmartContract) GetIndexKeyList(ctx contractapi.TransactionContextInterface, indexName string) (string, error) {
	refIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(indexName, []string{})
	if err != nil {
		// return shim.Error(err.Error())
		return "", err
	}

	defer refIterator.Close()

	var keys []string = make([]string, 0)
	for refIterator.HasNext() {
		value, err := refIterator.Next()
		if err != nil {
			return "", err
		}
		keys = append(keys, value.Key)
	}

	res := strings.Join(keys, "\n")
	fmt.Println("RR:", len(keys), res)
	return res, nil
}

// DelIndex - del index by index name
func (s *SmartContract) DelIndex(ctx contractapi.TransactionContextInterface, indexName string) error {
	refIterator, err := ctx.GetStub().GetStateByPartialCompositeKey(indexName, []string{})
	if err != nil {
		// return shim.Error(err.Error())
		return err
	}

	defer refIterator.Close()

	for refIterator.HasNext() {
		value, err := refIterator.Next()
		if err != nil {
			return err
		}
		err = ctx.GetStub().DelState(value.Key)
		if err != nil {
			return err
		}
	}
	return nil
}

// verifies non-emptines of parameters mode and state
func verifyParameters(mode string, state string) error {
	if !(mode == "insert" || mode == "update" || mode == "delete") {
		return fmt.Errorf("Paramtere 'mode' must be either 'insert', 'update' or 'delete")
	}
	if state == "" {
		return fmt.Errorf("Parameter 'state' must be non empty string")
	}
	return nil
}

func stringInSlice(a string, list []interface{}) bool {
	for _, b := range list {
		if b.(string) == a {
			return true
		}
	}
	return false
}

// updates references in reference index according to foreign key scheme
func checkCurrentStateAndUpdateReferenceIndex(ctx contractapi.TransactionContextInterface, data *map[string]interface{}, mode string, foreignKeys *[]ForeignKeyScheme, uniqueKeys *[]UniqueKeyScheme, joinKeys *[]JoinKeyScheme) error {
	fmt.Println("updateReferenceIndex", *data, mode, foreignKeys, uniqueKeys)
	key := (*data)["dbKey"].(string)
	currentState, err := ctx.GetStub().GetState(key)
	if err != nil {
		return err
	}
	if len(currentState) == 0 && mode != "insert" {
		return fmt.Errorf("Object does not exist. Update not possible")
	}
	if len(currentState) > 0 && mode == "insert" {
		return fmt.Errorf("Object already exists. Insert not possible")
	}
	if foreignKeys == nil && uniqueKeys == nil {
		return nil
	}

	// if mode != "update" {
	// 	return fmt.Errorf("Wrong mode '%s'. Should be 'update'", mode)
	// }
	var currentData map[string]interface{}
	if mode == "update" {
		err = json.Unmarshal([]byte(string(currentState)), &currentData)
		if err != nil {
			return err
		}
	}

	if foreignKeys != nil {
		var refKey string
		var oldRefKey string
		for _, element := range *foreignKeys {
			fmt.Println("LOOP:", element)
			if !element.IsArray { // single reference
				if mode == "insert" {
					fmt.Println("INSERT INDEX:", element.Field, (*data)[element.Field])
					if (*data)[element.Field] != nil {
						refKey = (*data)[element.Field].(string)
						err = insertIndexReference(ctx, key, refKey)
						if err != nil {
							return err
						}
					}
					continue
				}
				// update, not array
				if currentData[element.Field] == nil {
					if (*data)[element.Field] != nil {
						refKey = (*data)[element.Field].(string)
						err = insertIndexReference(ctx, key, refKey)
						if err != nil {
							return err
						}
					}
				} else {
					oldRefKey = currentData[element.Field].(string)
					if (*data)[element.Field] != nil {
						refKey = (*data)[element.Field].(string)
						if refKey != oldRefKey {
							err = deleteCompositeIndexEntry(ctx, "ref", []string{oldRefKey, key})
							if err != nil {
								return err
							}
							err = insertIndexReference(ctx, key, refKey)
							if err != nil {
								return err
							}
						}
					} else {
						err = deleteCompositeIndexEntry(ctx, "ref", []string{oldRefKey, key})
						if err != nil {
							return err
						}
					}
				}

			}
			if element.IsArray { // array references
				fmt.Println("ISARRAY:", element.Field)
				if mode == "insert" {
					fmt.Println("INSERT INDEX ARR:", element.Field, (*data)[element.Field])
					if (*data)[element.Field] != nil {
						for _, target := range (*data)[element.Field].([]interface{}) {
							err = insertIndexReference(ctx, key, target.(string))
							if err != nil {
								return err
							}
						}
					}
					continue
				}
				// update, array
				var refKeys []interface{}
				var oldRefKeys []interface{}
				if currentData[element.Field] == nil {
					if (*data)[element.Field] != nil {
						toCheck := (*data)[element.Field].([]interface{})
						for _, target := range toCheck {
							err = insertIndexReference(ctx, key, target.(string))
							if err != nil {
								return err
							}
						}
						// toAdd = (*data)[element.Field].([]string)
					}
				} else if len(currentData[element.Field].([]interface{})) > 0 {
					oldRefKeys = currentData[element.Field].([]interface{})
					if (*data)[element.Field] != nil {
						refKeys = (*data)[element.Field].([]interface{})
						for _, target := range refKeys {
							if len(oldRefKeys) > 0 && !stringInSlice(target.(string), oldRefKeys) {
								err = insertIndexReference(ctx, key, target.(string))
								if err != nil {
									return err
								}
							}
						}
						for _, target := range oldRefKeys {
							if len(refKeys) > 0 && !stringInSlice(target.(string), refKeys) {
								err = deleteCompositeIndexEntry(ctx, "ref", []string{target.(string), key})
								if err != nil {
									return err
								}
							}
						}
					} else { // new reference list is nil
						for _, target := range oldRefKeys {
							err = deleteCompositeIndexEntry(ctx, "ref", []string{target.(string), key})
							if err != nil {
								return err
							}
						}
					}
				}

			}
		}
	}

	if uniqueKeys != nil {
		for _, uniqueKey := range *uniqueKeys {
			if mode == "update" {
				eq, err := compareIndexUnique(ctx, data, &currentData, &uniqueKey)
				if err != nil {
					return err
				}
				if eq {
					continue
				}
				deleteIndexUnique(ctx, &currentData, &uniqueKey)
			}
			insertIndexUnique(ctx, data, &uniqueKey)
		}
	}

	if joinKeys != nil {
		for _, joinKey := range *joinKeys {
			if mode == "update" {
				deleteIndexJoin(ctx, &currentData, &joinKey)
			}
			insertIndexJoin(ctx, data, &joinKey)
		}
	}

	return nil
}

// performs all necessary verifications and initializations before inserting on state data.
func verifyFixAndInitialize(ctx contractapi.TransactionContextInterface, mode string, state string, data *map[string]interface{}) error {
	err := verifyParameters(mode, state)
	if err != nil {
		return err
	}
	err = verifyAndFixJSON(state, data)
	if err != nil {
		return err
	}

	foreignKeys := foreignKeySchemeForObject(data)            // pointer to array
	uniqueKeys := uniqueKeySchemeForObject(data)              // pointer to array
	joinKeys := joinKeySchemeForObject(data)                  // pointer to array
	fieldsToCleanOnSave := fieldsToCleanOnSaveForObject(data) // pointer to array

	// fmt.Println("FKS:", *foreignKeys)
	// fmt.Println("UKS:", *uniqueKeys)
	err = checkIfCanInsert(ctx, mode, data, foreignKeys, uniqueKeys, fieldsToCleanOnSave)
	if err != nil {
		return err
	}

	// Fix reference index according to ForeignKeyScheme
	err = checkCurrentStateAndUpdateReferenceIndex(ctx, data, mode, foreignKeys, uniqueKeys, joinKeys)
	if err != nil {
		return err
	}
	return nil
}

func diffStateMaps(sources []map[string]interface{}, targets []map[string]interface{}) ([]map[string]interface{}, []map[string]interface{}, []map[string]interface{}) {
	existing := make([]map[string]interface{}, 0)
	new := make([]map[string]interface{}, 0)
	removed := make([]map[string]interface{}, 0)

	// TODO: implement

	return existing, new, removed
}

// updates one to many list (applies changes from targets to sources and manages items through create, update, and delete function)
/* func updateOneToManyList(
	sources []map[string]interface{},
	targets []map[string]interface{},
	insert func(map[string]interface{}) (map[string]interface{}, error),
	delete func(map[string]interface{}) error) error {

	if sources == nil {
		return nil
	}

	if targets == nil {
		targets = make([]map[string]interface{}, 0)
	}

	var toDelete []int
	for i, source := range sources {
		var target map[string]interface{}
		for _, t := range targets {
			if t == nil || t["dbKey"] == nil {
				return fmt.Errorf("Invalid item in one to many list")
			}
			if t["dbKey"].(string) == source["dbKey"].(string) {
				target = t
				break
			}
		}
		if target == nil {
			toDelete = append(toDelete, i)
		} else {
			_, err := insert(target) // update
			if err != nil {
				return err
			}
		}
	}
	for i, index := range toDelete {
		if delete != nil {
			delete(sources[index-i])
		}
		copy(sources[index-i:], sources[index-i+1:])
	}
	sources = sources[:len(sources)-len(toDelete)]
	for _, target := range targets {
		if target == nil || target["dbKey"] == nil {
			return fmt.Errorf("Invalid item in one to many list")
		}
		if target["dbKey"].(string) == "" {
			source, err := insert(target)
			if err != nil {
				return err
			}
			sources = append(sources, source)
		}
	}

	return nil
}*/

// compares sources (old list) to targets (new list) based on dbKey:
//  * deletes items from sources that are not present in targets (function delete)
//  * inserts items from targets that are present in targets (function insert as update function)
//  * inserts items from targets that are not present in sources (function insert as create function)
// list sources is inconsistently modified!
func updateOneToManyList(
	sources []map[string]interface{},
	targets []map[string]interface{},
	insert func(map[string]interface{}) error,
	delete func(map[string]interface{}) error) error {

	var err error

	if sources == nil {
		sources = make([]map[string]interface{}, 0)
	}

	if targets == nil {
		targets = make([]map[string]interface{}, 0)
	}

	var toDelete []int
	for i, source := range sources {
		if source == nil || source["dbKey"] == nil {
			return fmt.Errorf("Invalid item in one to many list")
		}
		var target map[string]interface{}
		for _, t := range targets {
			if t == nil || t["dbKey"] == nil {
				return fmt.Errorf("Invalid item in one to many list")
			}
			if t["dbKey"].(string) == source["dbKey"].(string) {
				target = t
				break
			}
		}
		if target == nil {
			toDelete = append(toDelete, i)
		} else {
			err = insert(target) // update
			if err != nil {
				return err
			}
		}
	}

	for i, index := range toDelete {
		if delete != nil {
			delete(sources[index-i])
		}
		copy(sources[index-i:], sources[index-i+1:])
	}
	sources = sources[:len(sources)-len(toDelete)]

	for _, target := range targets {
		if target == nil || target["dbKey"] == nil {
			return fmt.Errorf("Invalid item in one to many list")
		}
		var source map[string]interface{}
		for _, s := range sources {
			if s["dbKey"] == target["dbKey"] {
				source = s
				break
			}
		}
		if source == nil {
			err = insert(target) // create
			if err != nil {
				return nil
			}
		}
	}

	return nil
}

// ManageState - inserts the organization. Parameter mode must be one of "insert", "update" or "delete".
// Key is "" for insert and update, but is mandatory for delete.
func (s *SmartContract) ManageState(ctx contractapi.TransactionContextInterface, mode string, state string, key string) error {

	var data map[string]interface{}

	if mode == "insert" || mode == "update" {
		err := verifyFixAndInitialize(ctx, mode, state, &data)
		// TODO: vnos refIndexa
		// Primerjava s prejšnjim stanjem in brisanje ter dodajanje refIndex entryev
		if err != nil {
			return err
		}
		// !!! correct so that fields to clean are not cleaned until here
		return insertData(ctx, &data)
	}
	if mode == "delete" {

		if key == "" {
			return fmt.Errorf("Cannot delete empty key")
		}
		isRef, err := isKeyReferenced(ctx, key)
		if err != nil {
			return err
		}
		if isRef {
			return fmt.Errorf("Cannot delete the state. It is referenced by other states")
		}

		ok, err := getStateMap(ctx, key, &data)
		if err != nil {
			return err
		}
		if !ok {
			return fmt.Errorf("Object on key %s does not exist. Cannot delete", key)
		}
		foreignKeys := foreignKeySchemeForObject(&data)
		if foreignKeys != nil {
			err := removeForeignKeysRefsFromIndex(ctx, &data, foreignKeys)
			if err != nil {
				return err
			}
		}
		uniqueKeys := uniqueKeySchemeForObject(&data)
		if uniqueKeys != nil {
			err := removeUniqueKeysRefsFromIndex(ctx, &data, uniqueKeys)
			if err != nil {
				return err
			}
		}
		joinKeys := joinKeySchemeForObject(&data)
		if joinKeys != nil {
			err := removeJoinKeysRefsFromIndex(ctx, &data, joinKeys)
			if err != nil {
				return err
			}
		}

		err = ctx.GetStub().DelState(key)
		return err
	}
	return fmt.Errorf("Wrong mode: %s", mode)
}

func insertStockOrderWithTransactions(ctx contractapi.TransactionContextInterface, order *map[string]interface{}) error {
	// TODO: foreign keys, cleaning, etc

	dbKey := (*order)["dbKey"].(string)

	var currentOrder map[string]interface{}
	exists, err := getStateMap(ctx, dbKey, &currentOrder)
	if err != nil {
		return err
	}
	if exists {
		// (*order)["totalQuantity"] = (*order)["totalQuantity"] // should it be currentOrder or is redundant?
		(*order)["availableQuantity"] = currentOrder["availableQuantity"]
		(*order)["fullfilledQuantity"] = currentOrder["fullfilledQuantity"]
	} else {
		if (*order)["fullfilledQuantity"] != nil {
			fullfilledQuantity, err := extractFloatValue(*order, "fullfilledQunatity")
			if err != nil {
				return err
			}
			if fullfilledQuantity > 0 {
				return fmt.Errorf("Fullfilled quantity must be 0")
			}
		}
	}

	transactionsRaw := (*order)["inputTransactions"]
	if transactionsRaw == nil {
		return nil
	}
	transactions := transactionsRaw.([]map[string]interface{})
	for index, _ := range transactions {
		if transactions[index] == nil {
			continue
		}
		transaction := transactions[index]
		if transaction != nil && transaction["dbKey"] != nil && transaction["targetStockOrderId"].(string) != dbKey {
			return fmt.Errorf("Invalid transaction")
		}
	}

	currentTransactions, err := getInputTransactions(ctx, dbKey)
	if err != nil {
		return err
	}

	// clean fields on order
	insertData(ctx, order)

	err = updateTransactions(ctx, currentTransactions, transactions)
	if err != nil {
		return err
	}

	return nil
}

func insertProcessingOrderWithTransactionsAndStockOrders(ctx contractapi.TransactionContextInterface, order *map[string]interface{}) error {
	var err error

	// TODO: foreign keys check, key replacement

	dbKey, err := extractOrGenerateDbKey(order)
	if err != nil {
		return err
	}

	var action map[string]interface{}
	exists, err := getStateMap(ctx, (*order)["processingActionId"].(string), &action)
	if err != nil {
		return err
	}
	if !exists {
		return fmt.Errorf("No action for processing order")
	}
	actionType, err := extractStringValue(action, "type")
	if err != nil {
		return err
	}

	transactionsRaw := (*order)["inputTransactions"]
	var transactions []map[string]interface{}
	if transactionsRaw != nil {
		transactions = transactionsRaw.([]map[string]interface{})
	}
	if transactions == nil {
		transactions = make([]map[string]interface{}, 0)
	}

	targetStockOrdersRaw := (*order)["targetStockOrders"]
	var targetStockOrders []map[string]interface{}
	if targetStockOrdersRaw != nil {
		targetStockOrders = targetStockOrdersRaw.([]map[string]interface{})
	}
	if targetStockOrders == nil {
		targetStockOrders = make([]map[string]interface{}, 0)
	}

	if actionType == "SHIPMENT" {
		if len(targetStockOrders) != 1 {
			return fmt.Errorf("Invalid number of target stock orders")
		}
		stockOrder := targetStockOrders[0]
		stockOrder["processingOrderId"] = dbKey
		stockOrder["processingAcctionId"] = (*order)["processingActionId"]
		err = insertStockOrderWithTransactions(ctx, &stockOrder)
		if err != nil {
			return err
		}
		(*order)["targetStockOrderIds"] = []string{stockOrder["dbKey"].(string)}

		// TODO: clean fields
		insertData(ctx, order)
		return nil
	}

	if actionType == "PROCESSING" {
		for _, transaction := range transactions {
			if transaction["targetStockOrderId"].(string) != dbKey {
				return fmt.Errorf("Invalid transaction")
			}
		}
	}

	if actionType == "TRANSFER" {
		if len(transactions) != len(targetStockOrders) {
			return fmt.Errorf("The number of input transactions must match the number of target orders")
		}
		for index, transaction := range transactions {
			if transaction["targetStockOrderId"] == nil || transaction["targetStockOrderId"].(string) == "" {
				transaction["targetStockOrderId"] = targetStockOrders[index]["dbKey"]
			} else if transaction["targetStockOrderId"].(string) != targetStockOrders[index]["dbKey"].(string) {
				return fmt.Errorf("Transaction on index %v does not match target order", index)
			}
		}
	}

	currentTransactions, err := getInputTransactions(ctx, dbKey)
	if err != nil {
		return err
	}

	updateTransactions(ctx, currentTransactions, transactions)

	var currentOrder map[string]interface{}
	exists, err = getStateMap(ctx, dbKey, &currentOrder)
	if err != nil {
		return err
	}
	var currentTargetStockOrders []map[string]interface{}
	if exists {
		currentTargetStockOrderIds := currentOrder["targetStockOrderIds"].([]string)
		currentTargetStockOrders, err = getStateMaps(ctx, currentTargetStockOrderIds)
		if err != nil {
			return err
		}
	} else {
		currentTargetStockOrders = make([]map[string]interface{}, 0)
	}

	err = updateStockOrders(ctx, currentTargetStockOrders, targetStockOrders)
	if err != nil {
		return err
	}

	insertData(ctx, order)

	return nil
}

func updateTransactions(ctx contractapi.TransactionContextInterface, sources []map[string]interface{}, targets []map[string]interface{}) error {
	insertTx := func(transaction map[string]interface{}) error {
		_, err := insertTransaction(ctx, transaction)
		return err
	}
	deleteTx := func(transaction map[string]interface{}) error {
		return deleteTransaction(ctx, transaction)
	}
	return updateOneToManyList(sources, targets, insertTx, deleteTx)
}

func insertTransaction(ctx contractapi.TransactionContextInterface, transaction map[string]interface{}) (map[string]interface{}, error) {
	sourceOrderRaw := transaction["sourceStockOrderId"]
	if sourceOrderRaw != nil {
		var sourceOrder map[string]interface{}
		exists, err := getStateMap(ctx, sourceOrderRaw.(string), &sourceOrder)
		if err != nil {
			return nil, err
		}
		if exists {
			transaction["inputMeasureUnitType"] = sourceOrder["measurementUnitType"]
			transaction["sourceFacilityId"] = sourceOrder["facilityId"]
			transaction["semiProductId"] = sourceOrder["semiProductId"]

			// TODO: modify quantities !?!?
			insertData(ctx, &sourceOrder) // necessary?
		}
	}

	targetOrderRaw := transaction["targetStockOrderId"]
	processingTransaction, err := extractBoolValue(transaction, "isProcessing")
	if err != nil {
		return nil, err
	}
	if processingTransaction {
		transaction["outputMeasureUnitType"] = transaction["inputMeasureUnitType"]
	} else if targetOrderRaw != nil {
		var targetOrder map[string]interface{}
		exists, err := getStateMap(ctx, targetOrderRaw.(string), &targetOrder)
		if err != nil {
			return nil, err
		}
		if exists {
			transaction["outputMeasureUnitType"] = targetOrder["measurementUnitType"]
			transaction["targetFacilityId"] = targetOrder["facilityId"]
			if targetOrder["semiProductId"] != transaction["semiProductId"] {
				return nil, fmt.Errorf("Target semi product does not match source semi product")
			}

			// TODO: modify quantities !?!?
			insertData(ctx, &targetOrder) // necessary?
		}
	}

	// TODO: timestamps on transaction ???

	// TODO: save transaction

	return transaction, nil
}

func deleteTransaction(ctx contractapi.TransactionContextInterface, transaction map[string]interface{}) error {
	sourceOrderRaw := transaction["sourceStockOrderId"]
	if sourceOrderRaw != nil {
		var sourceOrder map[string]interface{}
		exists, err := getStateMap(ctx, sourceOrderRaw.(string), &sourceOrder)
		if err != nil {
			return err
		}
		if exists {
			availableQuantity, err := extractFloatValue(sourceOrder, "availableQuantity")
			if err != nil {
				return err
			}
			totalQuantity, err := extractFloatValue(sourceOrder, "totalQuantity")
			if err != nil {
				return err
			}
			inputQuantity, err := extractFloatValue(transaction, "inputQuantity")
			if err != nil {
				return err
			}
			sourceOrder["availableQuantity"] = math.Min(availableQuantity+inputQuantity, totalQuantity)
			insertData(ctx, &sourceOrder)
		}
	}

	targetOrderRaw := transaction["targetStockOrderId"]
	processingTransaction, err := extractBoolValue(transaction, "isProcessing")
	if err != nil {
		return err
	}
	if !processingTransaction && targetOrderRaw != nil {
		var targetOrder map[string]interface{}
		exists, err := getStateMap(ctx, targetOrderRaw.(string), &targetOrder)
		if err != nil {
			return err
		}
		if exists {
			fullfilledQuantity, err := extractFloatValue(targetOrder, "fullfilledQuantity")
			if err != nil {
				return err
			}
			outputQuantity, err := extractFloatValue(transaction, "outputQuantity")
			if err != nil {
				return err
			}
			targetOrder["fullfilledQuantity"] = math.Max(fullfilledQuantity-outputQuantity, 0)
			insertData(ctx, &targetOrder)
		}
	}

	err = ctx.GetStub().DelState(transaction["dbKey"].(string))
	if err != nil {
		return err
	}

	return nil
}

func updateStockOrders(ctx contractapi.TransactionContextInterface, sources []map[string]interface{}, targets []map[string]interface{}) error {
	insertOrder := func(order map[string]interface{}) error {
		_, err := insertStockOrder(ctx, order)
		return err
	}
	deleteOrder := func(order map[string]interface{}) error {
		return deleteStockOrder(ctx, order)
	}
	return updateOneToManyList(sources, targets, insertOrder, deleteOrder)
}

func insertStockOrder(ctx contractapi.TransactionContextInterface, order map[string]interface{}) (map[string]interface{}, error) {
	var err error

	err = transcribeKey(&order, "gradeAbbreviationId", "gradeAbbreviation")
	if err != nil {
		return nil, err
	}

	err = transcribeKey(&order, "requiredQualityId", "requiredQuality")
	if err != nil {
		return nil, err
	}

	totalQuantity, err := extractFloatValue(order, "totalQuantity")
	if err != nil {
		return nil, err
	}

	fullfilledQuantity, err := extractFloatValue(order, "fullfilledQuantity")
	if err != nil {
		return nil, err
	}

	availableQuantity, err := extractFloatValue(order, "availableQuantity")
	if err != nil {
		return nil, err
	}

	// TODO: compute balance and quantities?

	if fullfilledQuantity > totalQuantity {
		return nil, fmt.Errorf("Failed to insert stock order. Fullfilled quantity can not be larger than total quantity")
	}

	if availableQuantity > fullfilledQuantity {
		return nil, fmt.Errorf("Failed to insert stock order. Available quantity can not be larger than fullfilled quantity")
	}

	if availableQuantity > 0 {
		order["isAvailable"] = "1"
	} else {
		order["isAvailable"] = "0"
	}

	if order["orderType"] != nil && order["orderType"].(string) == "GENERAL_ORDER" && totalQuantity > fullfilledQuantity {
		order["isOpenOrder"] = "1"
	} else {
		order["isOpenOrder"] = "0"
	}

	if keyExists(order, "semiProductId") {
		return nil, fmt.Errorf("No semi product specified")
	}
	semiProduct, err := getExistentStateMap(ctx, order["semiProductId"].(string))
	if err != nil {
		return nil, err
	}
	order["measurementUnitType"] = semiProduct["measurementUnitType"]

	if order["pricePerUnit"] != nil && order["totalQuantity"] != nil {
		pricePerUnit, err := extractFloatValue(order, "pricePerUnit")
		if err != nil {
			return nil, err
		}
		totalQuantity, err := extractFloatValue(order, "totalQuantity")
		if err != nil {
			return nil, err
		}
		order["cost"] = pricePerUnit * totalQuantity
	}

	if keyExists(order, "facilityId") {
		facility, err := getExistentStateMap(ctx, order["facilityId"].(string))
		if err != nil {
			return nil, err
		}
		order["organizationId"] = facility["organizationId"]
	}

	if keyExists(order, "quouteFacilityId") {
		quoteFacility, err := getExistentStateMap(ctx, order["quoteFacilityId"].(string))
		if err != nil {
			return nil, err
		}
		order["quoteOrganizationId"] = quoteFacility["organizationId"]
	} else {
		order["quouteOrganizationId"] = ""
	}

	err = insertData(ctx, &order)
	if err != nil {
		return nil, err
	}

	if keyExists(order, "orderId") {
		productOrder, err := getExistentStateMap(ctx, order["orderId"].(string))
		if err != nil {
			return nil, err
		}
		_, err = insertProductOrder(ctx, productOrder)
		if err != nil {
			return nil, err
		}
	}

	return order, nil
}

func deleteStockOrder(ctx contractapi.TransactionContextInterface, order map[string]interface{}) error {
	dbKey := order["dbKey"].(string)

	inputTransactionKeys, err := getInputTransactionKeys(ctx, dbKey)
	if err != nil {
		return err
	}
	if len(inputTransactionKeys) > 0 {
		return fmt.Errorf("Stock order can not be deleted because it contains input transactions")
	}

	outputTransactionKeys, err := getOutputTransactionKeys(ctx, dbKey)
	if err != nil {
		return err
	}
	if len(outputTransactionKeys) > 0 {
		return fmt.Errorf("Stock order can not be deleted because it contains output transactions")
	}

	paymentKeys, err := getPaymentKeys(ctx, dbKey)
	if err != nil {
		return err
	}
	if len(paymentKeys) > 0 {
		return fmt.Errorf("Stock order can not be deleted becasue it contains payments")
	}

	if keyExists(order, "orderId") {
		productOrder, err := getExistentStateMap(ctx, order["orderId"].(string))
		if err != nil {
			return err
		}
		_, err = insertProductOrder(ctx, productOrder)
		if err != nil {
			return err
		}
	}

	return ctx.GetStub().DelState(dbKey)
}

func insertProductOrder(ctx contractapi.TransactionContextInterface, order map[string]interface{}) (map[string]interface{}, error) {
	var err error

	dbKey, err := extractOrGenerateDbKey(&order)
	if err != nil {
		return nil, err
	}

	err = transcribeKey(&order, "requiredGradeId", "requiredGrade")
	if err != nil {
		return nil, err
	}

	err = transcribeKey(&order, "facilityId", "facility")
	if err != nil {
		return nil, err
	}

	err = transcribeKey(&order, "customerId", "customer")
	if err != nil {
		return nil, err
	}

	if order["processingOrders"] != nil {
		processingOrders := order["processingOrders"].([]map[string]interface{})
		if processingOrders != nil {
			for _, processingOrder := range processingOrders {
				targetStockOrders := processingOrder["targetStockOrders"].([]map[string]interface{})
				targetStockOrders[0]["orderId"] = order["dbKey"]
				err = insertProcessingOrderWithTransactionsAndStockOrders(ctx, &processingOrder)
				if err != nil {
					return nil, err
				}
			}
		}
	}

	order["open"] = false
	stockOrders, err := getStockOrders(ctx, dbKey)
	for _, stockOrder := range stockOrders {
		totalQuantity, err := extractFloatValue(stockOrder, "totalQuantity")
		if err != nil {
			return nil, err
		}
		fullfilledQuantity, err := extractFloatValue(stockOrder, "fullfilledQuantity")
		if err != nil {
			return nil, err
		}
		if totalQuantity-fullfilledQuantity > 0 {
			order["open"] = true
			break
		}
	}

	insertData(ctx, &order)

	return order, nil
}

func getInputTransactions(ctx contractapi.TransactionContextInterface, orderKey string) ([]map[string]interface{}, error) {
	transactionKeys, err := getInputTransactionKeys(ctx, orderKey)
	if err != nil {
		return nil, err
	}
	return getStateMaps(ctx, transactionKeys)
}

func getInputTransactionKeys(ctx contractapi.TransactionContextInterface, orderKey string) ([]string, error) {
	return getPointersIndexJoin(ctx, "joinTxTrgStockOrder", orderKey)
}

func getOutputTransactions(ctx contractapi.TransactionContextInterface, orderKey string) ([]map[string]interface{}, error) {
	transactionKeys, err := getOutputTransactionKeys(ctx, orderKey)
	if err != nil {
		return nil, err
	}
	return getStateMaps(ctx, transactionKeys)
}

func getOutputTransactionKeys(ctx contractapi.TransactionContextInterface, orderKey string) ([]string, error) {
	return getPointersIndexJoin(ctx, "joinTxSrcStockOrder", orderKey)
}

func getPayments(ctx contractapi.TransactionContextInterface, orderKey string) ([]map[string]interface{}, error) {
	paymentKeys, err := getPaymentKeys(ctx, orderKey)
	if err != nil {
		return nil, err
	}
	return getStateMaps(ctx, paymentKeys)
}

func getPaymentKeys(ctx contractapi.TransactionContextInterface, orderKey string) ([]string, error) {
	return getPointersIndexJoin(ctx, "joinPayStockOrder", orderKey)
}

func getStockOrders(ctx contractapi.TransactionContextInterface, orderKey string) ([]map[string]interface{}, error) {
	stockOrderKeys, err := getStockOrderKeys(ctx, orderKey)
	if err != nil {
		return nil, err
	}
	return getStateMaps(ctx, stockOrderKeys)
}

func getStockOrderKeys(ctx contractapi.TransactionContextInterface, orderKey string) ([]string, error) {
	return getPointersIndexJoin(ctx, "joinStockOrderOrder", orderKey)
}

/////////////////////////////////////////
// FOREIGN KEYS AND READ ONLY PARAMETERS
/////////////////////////////////////////

// returns foreign key scheme for particular
func foreignKeySchemeForObject(data *map[string]interface{}) *[]ForeignKeyScheme {
	docType := (*data)["docType"].(string)

	if docType == "organization" {
		return &organizationFK
	}
	if docType == "facility" {
		return &facilityFK
	}
	if docType == "product" {
		return &productFK
	}
	if docType == "processing_action" {
		return &processingActionFK
	}
	if docType == "semi_product" {
		return &semiProductFK
	}
	if docType == "user" {
		return &userFK
	}
	if docType == "user_customer" {
		return &userCustomerFK
	}
	if docType == "company_customer" {
		return &companyCustomerFK
	}
	if docType == "stock_order" {
		return &stockOrderFK
	}
	if docType == "transaction" {
		return &transactionFK
	}
	if docType == "payment" {
		return &paymentFK
	}
	if docType == "bulk_payment" {
		return &bulkPaymentFK
	}
	if docType == "document" {
		return &documentFK
	}
	if docType == "order" {
		return &orderFK
	}
	if docType == "document_requirement" {
		return &documentRequirementFK
	}
	if docType == "document_requirement_list" {
		return &documentRequirementListFK
	}
	if docType == "c_facility_type" {
		return &facilityTypeFK
	}
	if docType == "c_action_type" {
		return &actionTypeFK
	}
	if docType == "c_measure_unit_type" {
		return &measureUnitTypeFK
	}
	if docType == "c_grade_abbreviation" {
		return &gradeAbbreviationFK
	}

	return nil
}

func uniqueKeySchemeForObject(data *map[string]interface{}) *[]UniqueKeyScheme {
	docType := (*data)["docType"].(string)

	if docType == "organization" {
		return &organizationUK
	}
	if docType == "facility" {
		return &facilityUK
	}
	if docType == "product" {
		return &productUK
	}
	if docType == "processing_action" {
		return &processingActionUK
	}
	if docType == "semi_product" {
		return &semiProductUK
	}
	if docType == "user" {
		return &userUK
	}
	if docType == "user_customer" {
		return &userCustomerUK
	}
	if docType == "company_customer" {
		return &companyCustomerUK
	}
	if docType == "stock_order" {
		return &stockOrderUK
	}
	if docType == "transaction" {
		return &transactionUK
	}
	if docType == "payment" {
		return &paymentUK
	}
	if docType == "bulk_payment" {
		return &bulkPaymentUK
	}
	if docType == "document" {
		return &documentUK
	}
	if docType == "order" {
		return &orderUK
	}
	if docType == "document_requirement" {
		return &documentRequirementUK
	}
	if docType == "document_requirement_list" {
		return &documentRequirementListUK
	}
	if docType == "c_facility_type" {
		return &facilityTypeUK
	}
	if docType == "c_action_type" {
		return &actionTypeUK
	}
	if docType == "c_measure_unit_type" {
		return &measureUnitTypeUK
	}
	if docType == "c_grade_abbreviation" {
		return &gradeAbbreviationUK
	}

	return nil
}

func joinKeySchemeForObject(data *map[string]interface{}) *[]JoinKeyScheme {
	docType := (*data)["docType"].(string)

	if docType == "organization" {
		return &organizationJK
	}
	if docType == "facility" {
		return &facilityJK
	}
	if docType == "product" {
		return &productJK
	}
	if docType == "processing_action" {
		return &processingActionJK
	}
	if docType == "semi_product" {
		return &semiProductJK
	}
	if docType == "user" {
		return &userJK
	}
	if docType == "user_customer" {
		return &userCustomerJK
	}
	if docType == "company_customer" {
		return &companyCustomerJK
	}
	if docType == "stock_order" {
		return &stockOrderJK
	}
	if docType == "transaction" {
		return &transactionJK
	}
	if docType == "payment" {
		return &paymentJK
	}
	if docType == "bulk_payment" {
		return &bulkPaymentJK
	}
	if docType == "document" {
		return &documentJK
	}
	if docType == "order" {
		return &orderJK
	}
	if docType == "document_requirement" {
		return &documentRequirementJK
	}
	if docType == "document_requirement_list" {
		return &documentRequirementListJK
	}
	if docType == "c_facility_type" {
		return &facilityTypeJK
	}
	if docType == "c_action_type" {
		return &actionTypeJK
	}
	if docType == "c_measure_unit_type" {
		return &measureUnitTypeJK
	}
	if docType == "c_grade_abbreviation" {
		return &gradeAbbreviationJK
	}

	return nil
}

func fieldsToCleanOnSaveForObject(data *map[string]interface{}) *[]string {
	docType := (*data)["docType"].(string)

	if docType == "organization" {
		return &organizationCS
	}
	if docType == "facility" {
		return &facilityCS
	}
	if docType == "product" {
		return &productCS
	}
	if docType == "processing_action" {
		return &processingActionCS
	}
	if docType == "semi_product" {
		return &semiProductCS
	}
	if docType == "user" {
		return &userCS
	}
	if docType == "user_customer" {
		return &userCustomerCS
	}
	if docType == "company_customer" {
		return &companyCustomerCS
	}
	if docType == "stock_order" {
		return &stockOrderCS
	}
	if docType == "transaction" {
		return &transactionCS
	}
	if docType == "payment" {
		return &paymentCS
	}
	if docType == "bulk_payment" {
		return &bulkPaymentCS
	}
	if docType == "document" {
		return &documentCS
	}
	if docType == "order" {
		return &orderCS
	}
	if docType == "document_requirement" {
		return &documentRequirementCS
	}
	if docType == "document_requirement_list" {
		return &documentRequirementListCS
	}
	if docType == "c_facility_type" {
		return &facilityTypeCS
	}
	if docType == "c_action_type" {
		return &actionTypeCS
	}
	if docType == "c_measure_unit_type" {
		return &measureUnitTypeCS
	}
	if docType == "c_grade_abbreviation" {
		return &gradeAbbreviationCS
	}

	return nil
}

//////////////////////////////////////////////////////////
// ORGANIZATION
//////////////////////////////////////////////////////////

var organizationFK []ForeignKeyScheme = nil
var organizationUK []UniqueKeyScheme = []UniqueKeyScheme{
	UniqueKeyScheme{
		Fields:   []string{"id"},
		Required: true,
	},
}
var organizationJK []JoinKeyScheme = nil
var organizationCS []string = nil

//////////////////////////////////////////////////////////
// FACILITY
//////////////////////////////////////////////////////////

var facilityFK = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "organizationId",
		DocType:  "organization",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "semiProductIds",
		DocType:  "semi_product",
		Required: true,
		IsArray:  true,
	},
}
var facilityUK []UniqueKeyScheme = nil
var facilityJK []JoinKeyScheme = nil
var facilityCS = []string{
	"organization",
	"semiProducts",
}

//////////////////////////////////////////////////////////
/// PRODUCT
//////////////////////////////////////////////////////////

var productFK []ForeignKeyScheme = nil
var productUK []UniqueKeyScheme = []UniqueKeyScheme{
	UniqueKeyScheme{
		Fields:   []string{"id"},
		Required: true,
	},
}
var productJK []JoinKeyScheme = nil
var productCS = []string{
	"organization",
}

//////////////////////////////////////////////////////////
/// PROCESSING ACTION
//////////////////////////////////////////////////////////

var processingActionFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "productId",
		DocType:  "product",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "organizationId",
		DocType:  "organization",
		Required: true,
		IsArray:  false,
	},
}
var processingActionUK []UniqueKeyScheme = nil
var processingActionJK []JoinKeyScheme = nil
var processingActionCS []string = []string{
	"inputSemiProduct",
	"outputSemiProduct",
	"requiredDocTypes",
}

//////////////////////////////////////////////////////////
/// SEMI PRODUCT
//////////////////////////////////////////////////////////

var semiProductFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "productId",
		DocType:  "product",
		Required: true,
		IsArray:  false,
	},
}
var semiProductUK []UniqueKeyScheme = nil
var semiProductJK []JoinKeyScheme = nil
var semiProductCS []string = []string{
	"product",
}

//////////////////////////////////////////////////////////
/// USER
//////////////////////////////////////////////////////////

var userFK []ForeignKeyScheme = nil
var userUK []UniqueKeyScheme = []UniqueKeyScheme{
	UniqueKeyScheme{
		Fields:   []string{"id"},
		Required: true,
	},
}
var userJK []JoinKeyScheme = nil
var userCS []string = nil

//////////////////////////////////////////////////////////
/// USER CUSTOMER
//////////////////////////////////////////////////////////

var userCustomerFK []ForeignKeyScheme = nil
var userCustomerUK []UniqueKeyScheme = []UniqueKeyScheme{
	UniqueKeyScheme{
		Fields:   []string{"id"},
		Required: true,
	},
}
var userCustomerJK []JoinKeyScheme = nil
var userCustomerCS []string = nil

//////////////////////////////////////////////////////////
/// COMPANY CUSTOMER
//////////////////////////////////////////////////////////

var companyCustomerFK []ForeignKeyScheme = nil
var companyCustomerUK []UniqueKeyScheme = nil
var companyCustomerJK []JoinKeyScheme = nil
var companyCustomerCS []string = nil

//////////////////////////////////////////////////////////
/// STOCK ORDER
//////////////////////////////////////////////////////////

var stockOrderFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "semiProductId",
		DocType:  "semi_product",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "facilityId",
		DocType:  "facility",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "orderId",
		DocType:  "order",
		Required: false,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "consumerCompanyCustomerId",
		DocType:  "company_customer",
		Required: false,
		IsArray:  false,
	},
}
var stockOrderUK []UniqueKeyScheme = []UniqueKeyScheme{
	UniqueKeyScheme{
		Fields:   []string{"organizationId", "identifier"},
		Required: false,
	},
	UniqueKeyScheme{
		Fields:   []string{"organizationId", "internalLotNumber"},
		Required: false,
	},
	UniqueKeyScheme{
		Fields:   []string{"organizationId", "lotNumber"},
		Required: false,
	},
}
var stockOrderJK []JoinKeyScheme = []JoinKeyScheme{
	JoinKeyScheme{
		Name:  "joinStockOrderOrder",
		Key:   "orderId",
		Value: "",
	},
}
var stockOrderCS = []string{
	"product",
	"semiProduct",
	"facility",
	"paid",
	"representativeOfProducerUserCustomer",
	"inputTransactions",
	"outputTransactions",
	"processingOrder",
	"gradeAbbreviation",
	"processingAction",
	"inputOrder",
	"client",
	"consumerCompanyCustomer",
	"requiredQuality",
	"triggerOrders",
}

//////////////////////////////////////////////////////////
/// TRANSACTION
//////////////////////////////////////////////////////////

var transactionFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "sourceStockOrderId",
		DocType:  "stock_order",
		Required: false,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "targetStockOrderId",
		DocType:  "",
		Required: false,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "initiatorUserId",
		DocType:  "user",
		Required: true,
		IsArray:  false,
	},
}
var transactionUK []UniqueKeyScheme = nil
var transactionJK []JoinKeyScheme = []JoinKeyScheme{
	JoinKeyScheme{
		Name:  "joinTxSrcStockOrder",
		Key:   "sourceStockOrderId",
		Value: "inputQuantity",
	},
	JoinKeyScheme{
		Name:  "joinTxTrgStockOrder",
		Key:   "targetStockOrderId",
		Value: "outputQuantity",
	},
}
var transactionCS []string = []string{
	"gradeAbbreviation",
}

//////////////////////////////////////////////////////////
/// PAYMENT
//////////////////////////////////////////////////////////

var paymentFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "stockOrderId",
		DocType:  "stock_order",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "payingOrganizationId",
		DocType:  "organization",
		Required: true,
		IsArray:  false,
	},
}
var paymentUK []UniqueKeyScheme = nil
var paymentJK []JoinKeyScheme = []JoinKeyScheme{
	JoinKeyScheme{
		Name:  "joinPayStockOrder",
		Key:   "stockOrderId",
		Value: "amount",
	},
}
var paymentCS []string = []string{
	"payingOrganizations",
	"recipientOrganization",
	"recipientUserCustomer",
	"recipientCompanyCustomer",
	"bankTransfer",
	"representativeOfRecipientOrganization",
	"representativeOfRecipientUserCustomer",
}

//////////////////////////////////////////////////////////
/// BULK PAYMENT
//////////////////////////////////////////////////////////

var bulkPaymentFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "payingOrganizationId",
		DocType:  "organization",
		Required: true,
		IsArray:  false,
	},
}
var bulkPaymentUK []UniqueKeyScheme = nil
var bulkPaymentJK []JoinKeyScheme = nil
var bulkPaymentCS []string = []string{
	"payingOrganization",
	"payments",
}

//////////////////////////////////////////////////////////
/// DOCUMENT
//////////////////////////////////////////////////////////

var documentFK []ForeignKeyScheme = nil
var documentUK []UniqueKeyScheme = nil
var documentJK []JoinKeyScheme = nil
var documentCS []string = nil

//////////////////////////////////////////////////////////
/// ORDER
//////////////////////////////////////////////////////////

var orderFK []ForeignKeyScheme = []ForeignKeyScheme{
	ForeignKeyScheme{
		Field:    "facilityId",
		DocType:  "facility",
		Required: true,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "customerId",
		DocType:  "company_customer",
		Required: false,
		IsArray:  false,
	},
	ForeignKeyScheme{
		Field:    "requiredGradeId",
		DocType:  "c_grade_abbreviation",
		Required: false,
		IsArray:  false,
	},
}
var orderUK []UniqueKeyScheme = nil
var orderJK []JoinKeyScheme = nil
var orderCS []string = []string{
	"facility",
	"items",
	"customer",
	"requiredGrade",
	"processingOrders",
}

//////////////////////////////////////////////////////////
/// DOCUMENT REQUIREMENT
//////////////////////////////////////////////////////////

var documentRequirementFK []ForeignKeyScheme = nil
var documentRequirementUK []UniqueKeyScheme = nil
var documentRequirementJK []JoinKeyScheme = nil
var documentRequirementCS []string = nil

//////////////////////////////////////////////////////////
/// DOCUMENT REQUIREMENT LIST
//////////////////////////////////////////////////////////

var documentRequirementListFK []ForeignKeyScheme = nil
var documentRequirementListUK []UniqueKeyScheme = nil
var documentRequirementListJK []JoinKeyScheme = nil
var documentRequirementListCS []string = nil

//////////////////////////////////////////////////////////
/// FACILITY TYPE
//////////////////////////////////////////////////////////

var facilityTypeFK []ForeignKeyScheme = nil
var facilityTypeUK []UniqueKeyScheme = nil
var facilityTypeJK []JoinKeyScheme = nil
var facilityTypeCS []string = nil

//////////////////////////////////////////////////////////
/// ACTION TYPE
//////////////////////////////////////////////////////////

var actionTypeFK []ForeignKeyScheme = nil
var actionTypeUK []UniqueKeyScheme = nil
var actionTypeJK []JoinKeyScheme = nil
var actionTypeCS []string = nil

//////////////////////////////////////////////////////////
/// MEASURE UNIT TYPE
//////////////////////////////////////////////////////////

var measureUnitTypeFK []ForeignKeyScheme = nil
var measureUnitTypeUK []UniqueKeyScheme = nil
var measureUnitTypeJK []JoinKeyScheme = nil
var measureUnitTypeCS []string = []string{
	"underlyingMeasurementUnitType",
}

//////////////////////////////////////////////////////////
/// GRADE ABBREVIATION
//////////////////////////////////////////////////////////

var gradeAbbreviationFK []ForeignKeyScheme = nil
var gradeAbbreviationUK []UniqueKeyScheme = nil
var gradeAbbreviationJK []JoinKeyScheme = nil
var gradeAbbreviationCS []string = nil

func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error creating storage chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting storage chaincode: %s", err.Error())
	}
}
