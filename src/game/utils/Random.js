class Random {
  constructor(seed = Date.now()) {
    this._modulus = 2 ** 31;
    this._multiplier = 1103515245;
    this._increment = 12345;
    this._state = seed % this._modulus;
  }

  _nextState() {
    this._state = (this._multiplier * this._state + this._increment) % this._modulus;
    return this._state;
  }

  getNextFloat() {
    const state = this._nextState();
    return state / this._modulus;
  }

  getNextInt(max) {
    if (max <= 0) throw new Error("El parámetro max debe ser mayor que 0.");
    return Math.floor(this.getNextFloat() * max);
  }

  getNextIntRange(min, max) {
    if (min >= max) throw new Error("min debe ser menor que max.");
    return min + this.getNextInt(max - min);
  }

  getNextBool(p = 0.5) {
    if (p < 0 || p > 1) throw new Error("p debe estar entre 0 y 1.");
    return this.getNextFloat() < p;
  }
}

export default Random;