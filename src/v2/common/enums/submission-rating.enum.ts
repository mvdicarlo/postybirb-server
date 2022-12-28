// Copied from PB+ src (commons/src/enums/submission-rating.enum.ts)
export enum ESubmissionRating { 
  GENERAL = 'general',
  MATURE = 'mature',
  ADULT = 'adult',
  EXTREME = 'extreme'
}

export namespace ESubmissionRating_Utils {
  /**
   * Get matching ESubmissionRating from string
   * @param srVal String value to convert
   * @returns Matching ESubmissionRating
   * @throws RangeError when srVal is an invalid rating key
   */
  export function fromStringValue(srVal: string): ESubmissionRating | never {
    const srIdx = Object
      .values(ESubmissionRating)
      .indexOf(srVal as ESubmissionRating);
    
    if(srIdx == -1) throw new RangeError(`Unknown submission rating: ${srVal}`)

    return ESubmissionRating[Object.keys(ESubmissionRating)[srIdx]]
  }
}