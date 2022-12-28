import {ESubmissionRating, ESubmissionRating_Utils} from "../../common/enums/submission-rating.enum"

// Twitter's warning tags
export enum ESensitiveMediaWarnings {
	OTHER = "other",
	GRAPHIC_VIOLENCE = "graphic_violence",
	ADULT_CONTENT = "adult_content"
}

export namespace ESensitiveMediaWarnings_Utils {
	/**
	 * Get matching ESensitiveMediaWarnings of given ESubmissionRating
	 * @param rating PB rating to convert to Twitter's warning tag
	 * @returns Matching ESensitiveMediaWarnings (Twitter warning tags) or
	 * undefined if none
	 */
	export function getSMWFromRating(
		rating: ESubmissionRating
	): ESensitiveMediaWarnings {
		switch(rating) {
			case ESubmissionRating.MATURE:
				return ESensitiveMediaWarnings.OTHER;
			case ESubmissionRating.ADULT:
				return ESensitiveMediaWarnings.ADULT_CONTENT;
			case ESubmissionRating.EXTREME:
				return ESensitiveMediaWarnings.GRAPHIC_VIOLENCE;
			default:
				return;
		}
	}

	/**
	 * Get matching ESensitiveMediaWarnings of given string (PB rating keys)
	 * @param strVal Value to convert
	 * @returns Matching ESensitiveMediaWarnings (Twitter warning tags) or
	 * undefined if none
	 * @throws RangeError when strVal is an invalid rating key
	 */
	export function fromPBRatingStringValue(
		strVal: string
	): ESensitiveMediaWarnings {
		return getSMWFromRating(ESubmissionRating_Utils.fromStringValue(strVal));
	}
}