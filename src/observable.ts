export default class Observable<T> {
  value: T;
  observers: ((value: T) => void)[];
  constructor(value: T) {
    this.value = value;
    this.observers = [];
    this.observe = this.observe.bind(this);
    this.postValue = this.postValue.bind(this);
    this.remove = this.remove.bind(this);
    this.getValue = this.getValue.bind(this);
  }
  observe(cb: (value: T) => void) {
    this.observers.push(cb);
  }

  remove(cb: (value: T) => void) {
    this.observers = this.observers.filter((v) => v !== cb);
  }

  postValue(value: T) {
    if (this.value === value) return;
    this.value = value;
    this.observers.forEach((cb) => cb(value));
  }

  getValue() {
    return this.value;
  }
}
