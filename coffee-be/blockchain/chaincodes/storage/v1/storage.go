package main

import (
	"encoding/json"
	"fmt"
	"strconv"
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
	if docType != element.DocType {
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

// performs several verifications and fixes of the object before saving (foreign keys, dbKey, deletes underscore fields and fields to be deleted before save)
func checkIfCanInsert(ctx contractapi.TransactionContextInterface, mode string, data *map[string]interface{}, foreignKeys *[]ForeignKeyScheme, fieldsToCleanOnSave *[]string) error {
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
	if value == "" {
		return "", fmt.Errorf("Field 'docType' is empty")
	}
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
// INDEX: (docType, id)
///////////////////////////////

// inserts a (docType, id) index entry simulated by composite key. Value is a key of the referenced object (the one with given docType and id)
func insertIndexDoctypeID(ctx contractapi.TransactionContextInterface, targetKey string, data *map[string]interface{}) error {
	docType, err0 := extractStringValue(*data, "docType")
	if err0 != nil {
		return err0
	}
	id, err1 := extractIntValue(*data, "id")
	if err1 != nil {
		return err1
	}
	key, err := ctx.GetStub().CreateCompositeKey("link_id", []string{docType, strconv.Itoa(id)})
	if err != nil {
		return err
	}
	return ctx.GetStub().PutState(key, []byte(targetKey))
}

// gets reference of the referenced object used in (docType, id) simulated index
func getIndexDocTypeIDRefKey(ctx contractapi.TransactionContextInterface, docType string, id int) (string, error) {
	key, err := ctx.GetStub().CreateCompositeKey("link_id", []string{docType, strconv.Itoa(id)})
	if err != nil {
		return "", err
	}
	refKeyRaw, err1 := ctx.GetStub().GetState(key)
	if err1 != nil {
		return "", fmt.Errorf("Failed to read state. %s", err)
	}
	refKey := string(refKeyRaw)
	return refKey, nil
}

// gets refereced object for the key (docType, id) in simulated index
func getByIndexDoctypeID(ctx contractapi.TransactionContextInterface, data *map[string]interface{}, docType string, id int) (bool, error) {
	key, err := ctx.GetStub().CreateCompositeKey("link_id", []string{docType, strconv.Itoa(id)})
	if err != nil {
		return false, err
	}
	refKeyRaw, err1 := ctx.GetStub().GetState(key)
	if err1 != nil {
		return false, fmt.Errorf("Failed to read state. %s", err)
	}
	if refKeyRaw == nil {
		return false, nil
	}
	refKey, err2 := getIndexDocTypeIDRefKey(ctx, docType, id)
	if err2 != nil {
		return false, err2
	}
	return getStateMap(ctx, refKey, data)
}

////////////////////////////////
// INDEX: (targetKey, originKey) - reference index
///////////////////////////////

// inserts a (docType, id) index entry simulated by composite key. Value is a key of the referenced object (the one with given docType and id)
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
func checkCurrentStateAndUpdateReferenceIndex(ctx contractapi.TransactionContextInterface, data *map[string]interface{}, mode string, foreignKeys *[]ForeignKeyScheme) error {
	fmt.Println("updateReferenceIndex", *data, mode, foreignKeys)
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
	if foreignKeys == nil {
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
	fieldsToCleanOnSave := fieldsToCleanOnSaveForObject(data) // pointer to array

	fmt.Println("FKS:", *foreignKeys)
	err = checkIfCanInsert(ctx, mode, data, foreignKeys, fieldsToCleanOnSave)
	if err != nil {
		return err
	}

	// Fix reference index according to ForeignKeyScheme

	// Check if reference to id is unique, if id exists

	docType := (*data)["docType"].(string)
	dbKey := (*data)["dbKey"].(string)
	idRaw := (*data)["id"]
	if idRaw != nil {
		var target map[string]interface{}
		id := int(idRaw.(float64))
		ok, err := getByIndexDoctypeID(ctx, &target, docType, id)
		if err != nil {
			return err
		}
		if ok {
			if mode == "insert" {
				return fmt.Errorf("Object with id: %d and docType: %s already exist. Invalid insert. Use update", id, docType)
			}
			if mode == "update" {
				targetDbKey := (*data)["dbKey"].(string)
				if targetDbKey != dbKey {
					return fmt.Errorf("Different object with same id %d already exists in database for docType %s. Invalid update", id, docType)
				}
			}
		}
		key := (*data)["dbKey"].(string)
		err = insertIndexDoctypeID(ctx, key, data)
		if err != nil {
			return err
		}
	}
	err = checkCurrentStateAndUpdateReferenceIndex(ctx, data, mode, foreignKeys)
	if err != nil {
		return err
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

		err = ctx.GetStub().DelState(key)
		return err
	}
	return fmt.Errorf("Wrong mode: %s", mode)
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
	// if docType == "product" {
	// 	return &
	// }
	// if docType == "process_action" {
	// 	return &
	// }

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

	return nil
}

//////////////////////////////////////////////////////////
// ORGANIZATION
//////////////////////////////////////////////////////////

var organizationFK []ForeignKeyScheme = nil
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

var facilityCS = []string{
	"organization",
	"semiProducts",
}

//////////////////////////////////////////////////////////
/// PRODUCT
//////////////////////////////////////////////////////////

var productFK []ForeignKeyScheme = nil
var productCS = []string{
	"organization",
}

//////////////////////////////////////////////////////////
/// PROCESSING ACTION
//////////////////////////////////////////////////////////

var processingActionFK []ForeignKeyScheme = nil
var processingActionCS []string = nil

//////////////////////////////////////////////////////////
/// SEMI PRODUCT
//////////////////////////////////////////////////////////

var semiProductFK []ForeignKeyScheme = nil
var semiProductCS []string = nil

//////////////////////////////////////////////////////////
/// USER
//////////////////////////////////////////////////////////

var userFK []ForeignKeyScheme = nil
var userCS []string = nil

//////////////////////////////////////////////////////////
/// USER CUSTOMER
//////////////////////////////////////////////////////////

var userCustomerFK []ForeignKeyScheme = nil
var userCustomerCS []string = nil

//////////////////////////////////////////////////////////
/// COMPANY CUSTOMER
//////////////////////////////////////////////////////////

var companyCustomerFK []ForeignKeyScheme = nil
var companyCustomerCS []string = nil

//////////////////////////////////////////////////////////
/// STOCK ORDER
//////////////////////////////////////////////////////////

var stockOrderFK []ForeignKeyScheme = nil
var stockOrderCS []string = nil

//////////////////////////////////////////////////////////
/// TRANSACTION
//////////////////////////////////////////////////////////

var transactionFK []ForeignKeyScheme = nil
var transactionCS []string = nil

//////////////////////////////////////////////////////////
/// PAYMENT
//////////////////////////////////////////////////////////

var paymentFK []ForeignKeyScheme = nil
var paymentCS []string = nil

//////////////////////////////////////////////////////////
/// DOCUMENT
//////////////////////////////////////////////////////////

var documentFK []ForeignKeyScheme = nil
var documentCS []string = nil

//////////////////////////////////////////////////////////
/// ORDER
//////////////////////////////////////////////////////////

var orderFK []ForeignKeyScheme = nil
var orderCS []string = nil

//////////////////////////////////////////////////////////
/// DOCUMENT REQUIREMENT
//////////////////////////////////////////////////////////

var documentRequirementFK []ForeignKeyScheme = nil
var documentRequirementCS []string = nil

//////////////////////////////////////////////////////////
/// DOCUMENT REQUIREMENT LIST
//////////////////////////////////////////////////////////

var documentRequirementListFK []ForeignKeyScheme = nil
var documentRequirementListCS []string = nil

//////////////////////////////////////////////////////////
/// FACILITY TYPE
//////////////////////////////////////////////////////////

var facilityTypeFK []ForeignKeyScheme = nil
var facilityTypeCS []string = nil

//////////////////////////////////////////////////////////
/// ACTION TYPE
//////////////////////////////////////////////////////////

var actionTypeFK []ForeignKeyScheme = nil
var actionTypeCS []string = nil

//////////////////////////////////////////////////////////
/// MEASURE UNIT TYPE
//////////////////////////////////////////////////////////

var measureUnitTypeFK []ForeignKeyScheme = nil
var measureUnitTypeCS []string = nil

//////////////////////////////////////////////////////////
/// GRADE ABBREVIATION
//////////////////////////////////////////////////////////

var gradeAbbreviationFK []ForeignKeyScheme = nil
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
