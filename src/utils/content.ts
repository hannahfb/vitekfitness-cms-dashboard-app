export const getImageDimensions = (wixUrl: string | null) => {
  if (!wixUrl) return { width: 0, height: 0 };

  const width = wixUrl.match(/originWidth=(\d+)/);
  const height = wixUrl.match(/originHeight=(\d+)/);

  return {
    width: width ? parseInt(width[1]) : 0,
    height: height ? parseInt(height[1]) : 0,
  };
};

export const reformatHtmlTags = (html: string): string => {
  return html.replace(/<[^>]*>/g, "").trim();
};

export const convertWixImageUrl = (wixUrl: string | null): string | null => {
  if (!wixUrl) return null;

  // wix:image://v1/4404aa_fa63dae8ad044bbbb9f2014afd56b3bd~mv2.png/image%2011_edited.png#originWidth=378&originHeight=358
  const match = wixUrl.match(/wix:image:\/\/v1\/([^\/]+)\/([^#]+)#(.+)/);
  if (!match) return wixUrl;

  const [, fileId, filename, params] = match;

  // EXTRACT IMAGE DIMENSIONS
  const widthMatch = params.match(/originWidth=(\d+)/);
  const heightMatch = params.match(/originHeight=(\d+)/);

  const origWidth = widthMatch ? parseInt(widthMatch[1]) : 400;
  const origHeight = heightMatch ? parseInt(heightMatch[1]) : 400;

  return `https://static.wixstatic.com/media/${fileId}/v1/fit/w_${origWidth},h_${origHeight}/${filename}`;
};