import { DBDocument, DocType } from "./DBDocument"

/**
 * Codebook for order evidence type
 */
export interface ChainOrderEvidenceType extends DocType {
  id: string,
  label: string,
  fairness?: boolean | null,
  provenance?: boolean | null,
  quality?: boolean | null
}


export class ChainOrderEvidenceTypeDB extends DBDocument<ChainOrderEvidenceType> {
  _prefix = "TORDEREVIDENCE"
  docType = "c_order_evidence_type"

}