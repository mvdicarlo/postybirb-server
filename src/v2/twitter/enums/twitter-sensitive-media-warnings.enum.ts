import {
  ESubmissionRating,
  ESubmissionRating_Utils,
} from '../../common/enums/submission-rating.enum';

// Twitter's warning tags
export enum ESensitiveMediaWarnings {
  OTHER = 'other',
  GRAPHIC_VIOLENCE = 'graphic_violence',
  ADULT_CONTENT = 'adult_content',
}

export type ContentBlurType = 'other' | 'graphic_violence' | 'adult_content' | undefined;

export namespace ESensitiveMediaWarnings_Utils {
  export function getSMWFromContentBlur(
    contentBlur?: ContentBlurType,
  ) {
    switch (contentBlur) {
      case 'other':
        return ESensitiveMediaWarnings.OTHER;
      case 'adult_content':
        return ESensitiveMediaWarnings.ADULT_CONTENT;
      case 'graphic_violence':
        return ESensitiveMediaWarnings.GRAPHIC_VIOLENCE;
      default:
        return undefined;
    }
  }
}
