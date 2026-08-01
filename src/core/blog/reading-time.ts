const WORDS_PER_MINUTE = 200;

export const getReadingTime = (content: string | undefined): number => {
	const wordCount = content?.trim().split(/\s+/).filter(Boolean).length ?? 0;

	return Math.max(1, Math.ceil(wordCount / WORDS_PER_MINUTE));
};
