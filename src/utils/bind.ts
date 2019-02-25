export function bind(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  return {
    // the first time the prototype property is accessed for an instance,
    // define an instance property pointing to the bound function.
    // This effectively "caches" the bound prototype method as an instance property.
    get() {
      const bound = descriptor.value.bind(this);
      Object.defineProperty(this, propertyKey, {
        value: bound
      });
      return bound;
    }
  };
}
