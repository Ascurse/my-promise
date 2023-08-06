import { isPromiseLike } from "./utils";

type Initializer<T> = (resolve: Resolve<T>, reject: Reject) => void;

type AnyFunction = (...args: any[]) => any;
type Resolve<T> = (value: T) => void;
type Reject = (reason?: any) => void;

type Status = "fulfilled" | "rejected" | "pending";

class MyPromise<T> {
  thenCallbacks: [
    AnyFunction | undefined,
    AnyFunction | undefined,
    Resolve<T>,
    Reject
  ][] = [];
  status: Status = "pending";
  value: T | null = null;
  error?: any;
  constructor(initializer: Initializer<T>) {
    initializer(this.resolve, this.reject);
  }

  then = (
    thenCallback?: (value: T) => void,
    catchCallback?: (reason?: any) => void
  ) => {
    return new MyPromise((resolve, reject) => {
      this.thenCallbacks.push([thenCallback, catchCallback, resolve, reject]);
    });
  };

  catch = (catchCallback: (reason?: any) => void) => {
    return new MyPromise((resolve, reject) => {
      this.thenCallbacks.push([undefined, catchCallback, resolve, reject]);
    });
  };

  private resolve = (value: T | PromiseLike<T>) => {
    if (isPromiseLike(value)) {
      value.then(this.resolve, this.reject);
    } else {
      this.status = "fulfilled";
      this.value = value;
      this.processNextTasks();
    }
  };

  private reject = (reason: any) => {
    this.status = "rejected";
    this.error = reason;
    this.processNextTasks();
  };

  private processNextTasks = () => {
    if (this.status === "pending") {
      return;
    }

    const thenCallbacks = this.thenCallbacks;
    this.thenCallbacks = [];

    thenCallbacks.forEach(([thenCallback, catchCallback, resolve]) => {
      try {
        if (this.status === "fulfilled") {
          const value = thenCallback ? thenCallback(this.value) : this.value;
          resolve(value);
        } else {
          const reason = catchCallback ? catchCallback(this.error) : this.error;
          resolve(reason);
        }
      } catch (error) {
        this.reject(error);
      }
    });
  };
}

const myPromise = new MyPromise<number>((resolve, reject) => {
  setTimeout(() => {
    resolve(5);
  }, 500);
});

const myPromise2 = myPromise
  .then((value) => {
    console.log("value myPromise2:", value);
  })
  .then((value) => {
    console.log("promise passed");

    return 6;
  });

const myPromise3 = myPromise2.then((value) => {
  console.log("value myPromise3:", value);
});
const promise = new Promise<number>((resolve, reject) => {
  setTimeout(() => {
    resolve(5);
  }, 500);
})
  .then((value) => {
    console.log("value:", value);
    return 6;
  })
  .catch((error) => {
    console.log("rejected:", error);
  });

const promise2 = promise.then((value) => {
  console.log("value promise2:", value);
});
