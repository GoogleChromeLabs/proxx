export class Random {
	constructor() {
	    // Third field is used provide wrap-around arithmetic
	    this.state = new BigUint64Array([BigInt("0x12345678"), BigInt("0x87654321"), BigInt(0)]);
	}
	static withSeed(seed) {
	    const rng = new Random();
	    rng.state[0] = BigInt(Math.floor(seed));
	    rng.jump();
	    return rng;
	}
	nextBigInt() {
	    let s1 = this.state[0];
	    let s0 = this.state[1];
	    this.state[0] = s0;
	    s1 ^= s1 << BigInt(23);
	    s1 ^= s1 >> BigInt(17);
	    s1 ^= s0;
	    s1 ^= s0 >> BigInt(26);
	    this.state[1] = s1;
	    this.state[2] = this.state[0] + this.state[1];
	    return this.state[2];
	}
	nextNumber({ min = 0, max = 1 } = {}) {
	    const norm = Number(this.nextBigInt() >> BigInt(11)) / 2 ** 53;
	    return norm * (max - min) + min;
	}
	nextNormal({ mu = 0, sigma = 1 } = {}) {
	    return (Math.sqrt(-2 * Math.log(this.nextNumber())) *
		Math.cos(2 * Math.PI * this.nextNumber()) *
		sigma +
		mu);
	}
	jump() {
	    let s0 = BigInt(0);
	    let s1 = BigInt(0);
	    for (let i = 0; i < Random.JUMP.length; i++) {
		for (let b = BigInt(0); b < BigInt(64); b++) {
		    if (Random.JUMP[i] & (BigInt(1) << b)) {
			s0 ^= this.state[0];
			s1 ^= this.state[1];
		    }
		    this.nextBigInt();
		}
	    }
	    this.state[0] = s0;
	    this.state[1] = s1;
	}
    }
    Random.JUMP = new BigUint64Array([
	BigInt("0x8a5cd789635d2dff"),
	BigInt("0x121fd2155c472f96"),
    ]);
    