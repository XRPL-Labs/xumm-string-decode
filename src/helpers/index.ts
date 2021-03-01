const tryUrlParams = <T>(url: URLSearchParams, find: Array<string>, cast: Function): string | undefined | T => {
  let value: string | T = undefined
  // tslint:disable-next-line
  for (let s in find) {
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
