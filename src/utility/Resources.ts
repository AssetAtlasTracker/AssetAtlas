export function until(conditionFunction : () => boolean) {

    const poll = (resolve: (value: unknown) => void) => {
      if(conditionFunction()) resolve(true);
      else setTimeout((_: unknown) => poll(resolve), 400);
    }
  
    return new Promise(poll);
}
