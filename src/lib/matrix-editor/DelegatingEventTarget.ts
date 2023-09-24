
/**
 * Delegates to another EventTarget. This allows us to implement the EventTarget
 * interface across all of our components in ES5. Directly extending the 
 * EventTarget class doesn't work when transpiling it down to ES5.
 */
export abstract class DelegatingEventTarget implements EventTarget {

  addEventListener(...args: any): void {
    const delegate = this.getDelegate()
    delegate.addEventListener.apply(delegate, args);
  }

  dispatchEvent(...args: any): boolean {
    const delegate = this.getDelegate()
    return delegate.dispatchEvent.apply(delegate, args);
  }

  removeEventListener(...args: any): void {
    const delegate = this.getDelegate()
    return delegate.removeEventListener.apply(delegate, args);
  }

  protected abstract getDelegate(): EventTarget; 
}