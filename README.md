# INATrace

Open-source blockchain-based track and trace system for an agricultural commodities (such as coffee) supply
chain run. It provides transparency and creation of trust through
digitalization of supply chains, connects every actor along the supply chain, assures quality and fair pricing.

Project is composed from 3 parts:

* [Java backend](https://github.com/INATrace/backend/tree/main) (Authentication, User, Product, Company APIs)
* [Coffee network](https://github.com/INATrace/coffee-network/tree/main) (StockOrder, Transaction, Order, SemiProduct APIs)
* [FE](https://github.com/INATrace/fe/tree/main)


# Coffee network

Based on GIT repositories
- https://github.com/adhavpavan/BasicNetwork-2.0.git
- https://github.com/hyperledger/fabric-samples.git

See also:
- https://www.youtube.com/playlist?list=PLSBNVhWU6KjW4qo1RlmR7cvvV8XIILub6

## Documentation

- https://www.hyperledger.org/projects/fabric
- Wiki: https://wiki.hyperledger.org/display/fabric/Hyperledger+Fabric
- Docs & Tutorial: https://hyperledger-fabric.readthedocs.io/en/latest/getting_started.html

## APIs
Most common API used:

- Insert or update facility
`POST /chain-api/data/facility`

```
request {
  "docType": "string",
  "_id": "string",
  "_rev": "string",
  "created": "string",
  "lastChange": "string",
  "userCreatedId": "string",
  "userChangedId": "string",
  "name": "string",
  "organizationId": "string",
  "facilityType": ChainFacilityType,
  "isCollectionFacility": true,
  "isPublic": true,
  "location": ChainLocation,
  "semiProducts": [
    ChainSemiProduct
  ],
  "semiProductIds": [
    "string"
  ],
  "semiProductPrices": [
    ChainSemiProductPrice
  ]
}
```

- Insert or update payment
`POST /chain-api/data/payment`

```
request {
  "docType": "string",
  "_id": "string",
  "_rev": "string",
  "created": "string",
  "lastChange": "string",
  "userCreatedId": "string",
  "userChangedId": "string",
  "formalCreationTime": "string",
  "currency": "string",
  "amount": 0,
  "amountPaidToTheCollector": 0,
  "stockOrderId": "string",
  "orderId": "string",
  "transactionIds": [
    "string"
  ],
  "payingOrganizationId": "string",
  "recipientOrganizationId": "string",
  "recipientUserCustomerId": "string",
  "representativeOfRecipientOrganizationId": "string",
  "representativeOfRecipientUserCustomerId": "string",
  "recipientCompanyCustomerId": "string",
  "receiptNumber": "string",
  "receiptDocument": ChainFileInfo,
  "bankTransferId": "string",
  "paymentConfirmedByUser": "string",
  "paymentConfirmedByOrganization": "string",
  "paymentConfirmedAtTime": "string",
  "payingOrganization": ChainOrganization,
  "recipientOrganization": ChainOrganization,
  "recipientUserCustomer": ChainUserCustomer,
  "recipientCompanyCustomer": ChainUserCustomer,
  "bankTransfer": ChainBulkPayment,
  "representativeOfRecipientOrganization": ChainOrganization,
  "representativeOfRecipientUserCustomer": ChainUserCustomer,
  "queryFacilityName": "string",
  "queryPurchaseOrderName": "string",
  "queryProducerUserCustomerName": "string",
  "preferredWayOfPayment": "string",
  "productionDate": "string"
}
```

- Insert or update transaction `POST /chain-api/data/transaction`

```
request {
  "docType": "string",
  "_id": "string",
  "_rev": "string",
  "created": "string",
  "lastChange": "string",
  "userCreatedId": "string",
  "userChangedId": "string",
  "organizationId": "string",
  "initiatorUserId": "string",
  "sourceStockOrderId": "string",
  "targetStockOrderId": "string",
  "semiProductId": "string",
  "sourceFacilityId": "string",
  "targetFacilityId": "string",
  "isProcessing": true,
  "actionType": ChainActionType,
  "shippmentId": "string",
  "inputMeasureUnitType": ChainMeasureUnitType,
  "inputQuantity": 0,
  "outputMeasureUnitType": ChainMeasureUnitType,
  "outputQuantity": 0,
  "pricePerUnit": 0,
  "currency": "string",
  "gradeAbbreviationId": "string",
  "rejectComment": "string",
  "gradeAbbreviation": ChainGradeAbbreviation,
  "sourceFacility": ChainFacility,
  "targetFacility": ChainFacility,
  "semiProduct": ChainSemiProduct,
  "sourceStockOrder": ChainStockOrder
}
```

- Insert or update semi-product `POST /chain-api/data/semi-product`

```
request {
  "docType": "string",
  "_id": "string",
  "_rev": "string",
  "created": "string",
  "lastChange": "string",
  "userCreatedId": "string",
  "userChangedId": "string",
  "productId": "string",
  "name": "string",
  "description": "string",
  "measurementUnitType": ChainMeasureUnitType,
  "isSKU": true,
  "isBuyable": true,
  "isSKUEndCustomer": true
}
```

- Insert or update stock order `POST /chain-api/data/stock-order`

```
request {
  "docType": "string",
  "_id": "string",
  "_rev": "string",
  "created": "string",
  "lastChange": "string",
  "userCreatedId": "string",
  "userChangedId": "string",
  "formalCreationTime": "string",
  "identifier": "string",
  "creatorId": "string",
  "representativeOfProducerUserCustomerId": "string",
  "producerUserCustomerId": "string",
  "productionLocation": ChainLocation,
  "certificates": [
    ChainCertification
  ],
  "consumerCompanyCustomerId": "string",
  "semiProductId": "string",
  "facilityId": "string",
  "organizationId": "string",
  "totalQuantity": 0,
  "fullfilledQuantity": 0,
  "availableQuantity": 0,
  "productionDate": "string",
  "expiryDate": "string",
  "estimatedDeliveryDate": "string",
  "deliveryTime": "string",
  "orderId": "string",
  "globalOrderId": "string",
  "documentRequirements": ChainDocumentRequirementList,
  "pricePerUnit": 0,
  "salesPricePerUnit": 0,
  "currency": "string",
  "salesCurrency": "string",
  "isPurchaseOrder": true,
  "gradeAbbreviationId": "string",
  "internalLotNumber": "string",
  "lotNumber": "string",
  "screenSize": "string",
  "comments": "string",
  "actionType": ChainActionType,
  "womenShare": 0,
  "cost": 0,
  "paid": 0,
  "balance": 0,
  "semiProduct": ChainSemiProduct,
  "facility": ChainFacility,
  "representativeOfProducerUserCustomer": ChainUserCustomer,
  "producerUserCustomer": ChainUserCustomer,
  "inputTransactions": [
    ChainTransaction
  ],
  "outputTransactions": [
    ChainTransaction
  ],
  "lotLabel": "string",
  "startOfDrying": "string",
  "clientId": 0,
  "flavourProfile": "string",
  "processingActionId": "string",
  "processingAction": ChainProcessingAction,
  "gradeAbbreviation": ChainGradeAbbreviation,
  "processingOrderId": "string",
  "processingOrder": ChainProcessingOrder,
  "consumerCompanyCustomer": ChainCompanyCustomer,
  "client": ChainOrganization,
  "sacNumber": 0,
  "triggerOrderIds": [
    "string"
  ],
  "quoteFacilityId": "string",
  "quoteOrganizationId": "string",
  "inputOrders": [
    ChainStockOrder
  ],
  "pricePerUnitForOwner": 0,
  "pricePerUnitForBuyer": 0,
  "exchangeRateAtBuyer": 0,
  "pricePerUnitForEndCustomer": 0,
  "exchangeRateAtEndCustomer": 0,
  "cuppingResult": "string",
  "cuppingGrade": "string",
  "cuppingFlavour": "string",
  "roastingDate": "string",
  "roastingProfile": "string",
  "shipperDetails": "string",
  "carrierDetails": "string",
  "portOfLoading": "string",
  "portOfDischarge": "string",
  "locationOfEndDelivery": "string",
  "dateOfEndDelivery": "string",
  "requiredWomensCoffee": true,
  "requiredQuality": ChainGradeAbbreviation,
  "requiredQualityId": "string",
  "shippedAtDateFromOriginPort": "string",
  "arrivedAtDateToDestinationPort": "string",
  "productOrder": ChainProductOrder,
  "triggerOrders": [
    ChainStockOrder
  ],
  "triggeredOrders": [
    ChainStockOrder
  ],
  "quoteFacility": ChainFacility,
  "quoteOrganization": ChainOrganization,
  "organization": ChainOrganization
}
```

Response is structured in following way:
It always contains attribute [`status`](https://github.com/INATrace/coffee-network/blob/main/coffee-be/src/models/chain/ApiResponse.ts).
If response is successful, then `status` is equal to 'OK' and appropriate response can be found under `data` attribute.
If response is unsuccessful (see above link for other statuses), then `errorMessage` attribute is returned.

Example of successful and unsuccessful response
```
{
"status": "OK",
  "data": {
    "id": 4,
    "email": "example@example.com",
    "name": "Example",
    "surname": "Example",
    "status": "ACTIVE",
    "role": "ADMIN",
    "actions": [
      "VIEW_USER_PROFILE",
      "UPDATE_USER_PROFILE"
    ],
    "companyIds": [
	1
    ]
  }
}
```

```
{
  "status": "AUTH_ERROR",
  "errorMessage": "Invalid credentials"
}
```

Other APIs can be found [here](https://github.com/INATrace/coffee-network/tree/main/coffee-be/src/controllers)

Database entities are listed [here](https://github.com/INATrace/coffee-network/tree/main/coffee-be/src/models/chain)


## Getting started
- Use Getting started documentation above
- Add `bin` folder from `fabric-samples` to `PATH` environment variable.

  
## Configuration of a network

- Organizations
    - Coop
    - Analytics
- Ordering organizations 
    - 1 ordering node
- 1 channel
- each organization:
    - 1 peer
- 1x CouchDB per peer


### Actions

Initializing the network

### First time (only once):
Remove tmp_data (if exists)

```
cd artifacts/channel
./create-artifacts.sh
```

```
cd ..
docker-compose up -d
cd ..
./createChannel.sh
```

Stopping the network

```
cd artifacts
docker-compose down
```

### Checking situation on a peer

Enter the peer container

- Find name of the container using `docker ps`
- `docker exec -it <name> sh`

List channels: 

- `peer channel list`
- Check last lines (skip verbose log)

Exit the container:

-  `exit`

### Persistance 

- For test deployment to be persistant folders from host have to mounted on peer, orderer and couchdb containers 

### Test development

See folder `chaincode-docker-devmode`. 

## Contribution

Project INATrace welcomes contribution from everyone. See CONTRIBUTING.md for help getting started.

## License 

Copyright (c) 2020 Anteja ECG d.o.o, GIZ - Deutsche Gesellschaft für Internationale Zusammenarbeit GmbH

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as published
by the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
