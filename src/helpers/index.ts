const tryUrlParams = <T>(url: URLSearchParams, find: string[], cast: Function): string | undefined | T => {
  let value: string | T = undefined
  for (const s in find) {
    if (url.get(find[s]) !== null) {
      value = cast(url.get(find[s]))
      break
    }
  }
  return value
}

export {
  tryUrlParams
}
