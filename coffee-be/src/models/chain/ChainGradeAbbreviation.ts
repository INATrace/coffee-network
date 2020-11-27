import { DBDocument, DocType } from "./DBDocument"

/**
 * Codebook for grade abbreviation
 */
export interface ChainGradeAbbreviation extends DocType {
  id: string,
  label: string
}


export class ChainGradeAbbreviationDB extends DBDocument<ChainGradeAbbreviation> {
  _prefix = "GRADE"
  docType = "c_grade_abbreviation"

}




