/**
 * Class that loads the matrix.
 * @param host The location of the server.
 */
export class MatrixLoader {
  private readonly projectId: number
  private readonly host: string

  private readOnly: boolean
  private isAborted: boolean
  private url: string

  constructor(projectId: number, host: string) {
    this.projectId = projectId
    this.host = host
    this.readOnly = false
    this.isAborted = false
  }

  /**
   * Sets the project and matrix id.
   *
   */
  setMatrixId(matrixId: number) {
    this.url =
      this.host +
      '/projects/' +
      this.projectId +
      '/matrices/' +
      matrixId +
      '/edit/'
  }

  /**
   * Sends a XHR to the server
   * @param request the builder of the request
   * @return The promise of this request
   */
  send(request: Request): Promise<Object> {
    let sendRetries = 0
    let sendDelay = 1000
    const query = request.getParameters()
    if (this.readOnly) {
      query['ro'] = 1
    }
    const options = {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      method: 'POST',
      credential: 'include',
      body: JSON.stringify(query),
    }
    const url = this.url + request.getMethod()
    return new Promise((resolve, reject) => {
      const fetchWithRequest = async () => {
        try {
          const response = await fetch(url, options)
          if (response.status == 401) {
            sendRetries = request.getRetries()
            return { errors: ['User is not signed in'] }
          }
          const data = await response.json()
          try {
            console.log(data)
            if (data['ok']) {
              resolve(data)
            } else {
              const errorMessage = data['errors'].join(',')
              reject(errorMessage)
            }
          } catch (e) {
            console.log(e)
            reject('Unknown error while process request')
          }
        } catch (e) {
          if (++sendRetries < request.getRetries()) {
            console.log("Damn... let's retry", e)
            const randomDelay = MatrixLoader.getRandomInt(0, sendDelay >> 1)
            setTimeout(() => fetchWithRequest(), sendDelay + randomDelay)
            sendDelay = Math.min(20000, sendDelay << 2)
          } else {
            console.log('Simply just fail the request', e)
            reject('An unknown error occurred.')
          }
        }
      }
      fetchWithRequest()
    })
  }

  /**
   * Aborts all the connections.
   */
  abort() {
    this.isAborted = true
  }

  /**
   * @return Whether the loaders were aborted.
   */
  getIsAborted(): boolean {
    return this.isAborted
  }

  /**
   * Determines whether the matrix should be readonly.
   * @param readonly whether the matrix should be readonly.
   */
  setReadonly(readonly: boolean) {
    this.readOnly = readonly
  }

  /**
   * Gets a random number in between two numbers
   * @param min The minimum number
   * @param max The maximum number
   * @return A random number in between
   */
  private static getRandomInt(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min)) + min
  }
}

/**
 * Class that builds a request.
 * @param opt_method The method of the request.
 */
export class Request {
  private method: string
  private params: { [key: string]: any }
  private retries: number
  private timeoutInterval: number

  constructor(opt_method?: string) {
    this.method = opt_method || ''
    this.params = {}
    this.retries = 3
    this.timeoutInterval = 45000
  }

  /**
   * Gets the method.
   * @return returns the method.
   */
  getMethod(): string {
    return this.method
  }

  /**
   * Sets the method.
   * @param method the method on the server to call.
   * @return returns RequestBuilder object
   */
  setMethod(method: string): Request {
    this.method = method
    return this
  }

  /**
   * Gets the parameters of the request.
   * @return the parameters of the request.
   */
  getParameters(): { [key: string]: any } {
    return this.params
  }

  /**
   * Adds a parameter to the request.
   * @param name the name of the parameter
   * @param value the value of the parameter
   * @return returns RequestBuilder object
   */
  addParameter(name: string, value: any): Request {
    this.params[name] = value
    return this
  }

  /**
   * @return The number of retries
   */
  getRetries(): number {
    return this.retries
  }

  /**
   * Sets the number of retries
   * @param retries The number of retries
   */
  setRetries(retries: number) {
    this.retries = retries
    return this
  }

  /**
   * @return The number of milliseconds before a retry
   */
  getTimeoutInterval(): number {
    return this.timeoutInterval
  }

  /**
   * The number of seconds before a retry
   * @param timeoutInterval The number of seconds before retrying
   */
  setTimeoutInterval(timeoutInterval: number) {
    this.timeoutInterval = timeoutInterval
    return this
  }
}
