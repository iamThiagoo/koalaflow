// CloudFront Functions (cloudfront-js-2.0) need a top-level `handler`; ES module syntax is not allowed.

/**
 * Rule: the www host redirects permanently to the apex with the same path and query.
 * Rule: a path ending in "/" serves that directory's index.html.
 * Rule: a path without a trailing slash or file extension redirects to the slash form.
 */
// biome-ignore lint/correctness/noUnusedVariables: invoked by CloudFront.
function handler(event) {
  const request = event.request;
  const host = request.headers.host ? request.headers.host.value : '';
  const uri = request.uri;
  const query = serializeQuery(request.querystring);

  if (host.startsWith('www.')) {
    return redirect(`https://${host.slice(4)}${uri}${query}`);
  }
  if (uri.endsWith('/')) {
    request.uri = `${uri}index.html`;
    return request;
  }
  const lastSegment = uri.slice(uri.lastIndexOf('/') + 1);
  if (!lastSegment.includes('.')) {
    return redirect(`${uri}/${query}`);
  }
  return request;
}

function redirect(location) {
  return {
    statusCode: 301,
    statusDescription: 'Moved Permanently',
    headers: { location: { value: location } },
  };
}

// Values arrive as sent by the viewer (still URL-encoded), so they are joined as is.
function serializeQuery(querystring) {
  const parts = [];
  for (const key in querystring) {
    const param = querystring[key];
    if (param.multiValue) {
      // cloudfront-js-2.0 rejects `for...of`.
      for (let i = 0; i < param.multiValue.length; i++) {
        const item = param.multiValue[i];
        parts.push(item.value === '' ? key : `${key}=${item.value}`);
      }
    } else {
      parts.push(param.value === '' ? key : `${key}=${param.value}`);
    }
  }
  return parts.length > 0 ? `?${parts.join('&')}` : '';
}
