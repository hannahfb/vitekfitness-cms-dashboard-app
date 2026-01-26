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