import { ChainProcessingOrder } from "./ChainProcessingOrder";
import { ChainProduct } from "./ChainProduct";
import { ChainProductOrder } from "./ChainProductOrder";
import { ChainStockOrder } from "./ChainStockOrder";
import { ChainTransaction } from "./ChainTransaction";

/**
 * User is a user in company
 */
export interface ChainHistory {
    /**
     * Order whose history is given
     */
    order?: ChainProductOrder;
    /**
     * Stock order whose history is given. Contains direct input transactions
     */
    stockOrder?: ChainStockOrder;
    /**
     * Processing order that produced this stock order. Contains all input transactions and output orders
     */
    processingOrder?: ChainProcessingOrder;
    /**
     * Ancestor chain
     */
    ancestors?: ChainHistory[],
}

// export class ChainUserDB extends DBDocument<ChainUser> {
//     _prefix = "USER"
//     docType = "user"
// }