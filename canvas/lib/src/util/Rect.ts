/**
 * Rectangular region represented by its
 * left, top, right and bottom coords.
 */
export class Rect {
    x: number;
    y: number;
    w: number;
    h: number;
    r: number;
    b: number;

    constructor(x: number, y: number, w: number, h: number) {
        this.reset(x, y, w, h);
    }

    isEmpty(): boolean {
        return (this.w <= 0) || (this.h <= 0);
    }

    reset(x, y, w, h): Rect {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
        this.r = x + w;
        this.b = y + h;
        return this;
    }

    resetFrom(r: Rect): Rect {
        this.x = r.x;
        this.y = r.y;
        this.w = r.w;
        this.h = r.h;
        this.r = r.x + r.w;
        this.b = r.y + r.h;
        return this;
    }

    includeRect(r: Rect): Rect {
        if (r.isEmpty()) {
            return this;
        }
        if (this.isEmpty()) {
            this.reset(r.x, r.y, r.w, r.h);
            return this;
        }
        if (this.r < r.r) {
            this.r = r.r;
        }
        if (this.b < r.b) {
            this.b = r.b;
        }
        if (this.x > r.x) {
            this.x = r.x;
        }
        if (this.y > r.y) {
            this.y = r.y;
        }
        this.w = this.r - this.x;
        this.h = this.b - this.y;
        return this;
    }

    include(x: number, y: number, w: number, h: number): Rect {
        if (this.isEmpty()) {
            this.reset(x, y, w, h);
            return this;
        }
        const r = x + w;
        const b = y + h;
        if (this.r < r) {
            this.r = r;
        }
        if (this.b < b) {
            this.b = b;
        }
        if (this.x > x) {
            this.x = x;
        }
        if (this.y > y) {
            this.y = y;
        }
        this.w = this.r - this.x;
        this.h = this.b - this.y;
        return this;
    }

    intersects(r: Rect): boolean {
        return (r.x <= this.r) && (r.r >= this.x) &&
            (r.y <= this.b) && (this.b >= r.y)
    }

    contains(x: number, y: number): boolean {

        return ((x > this.x) && (x < this.r)) &&
            ((y > this.y) && (y < (this.b)));
    }

    containsRect(r: Rect): boolean {
        return ((this.x <= r.x) && (this.r >= r.r)) &&
            ((this.y <= r.y) && (this.b >= r.b));
    }

    intersect(r: Rect): Rect {
        const left = Math.max(r.x, this.x);
        const top = Math.max(r.y, this.y);
        const right = Math.min(r.r, this.r);
        const bottom = Math.min(r.b, this.b);
        this.x = left;
        this.y = top;
        this.w = right - left;
        this.h = bottom - top;
        this.r = this.x + this.w;
        this.b = this.y + this.h;
        return this;
    }

    move(x: number, y: number): Rect {
        this.x = x;
        this.y = y;
        this.r = this.x + this.w;
        this.b = this.y + this.h;
        return this;
    }

    resize(w: number, h: number): Rect {
        this.w = w;
        this.h = h;
        this.r = this.x + this.w;
        this.b = this.y + this.h;
        return this;
    }

    shift(dx: number, dy: number): Rect {
        this.x += dx;
        this.y += dy;
        this.r = this.x + this.w;
        this.b = this.y + this.h;
        return this;
    }

    extend(dw: number, dh: number): Rect {
        this.w += dw;
        this.h += dh;
        this.r = this.x + this.w;
        this.b = this.y + this.h;
        return this;
    }

    size(): number {
        return this.w * this.h;
    }

    clone(): Rect {
        return new Rect(this.x, this.y, this.w, this.h);
    }

    equals(r: Rect): boolean {
        return (this.x == r.x) &&
            (this.y == r.y) &&
            (this.w == r.w) &&
            (this.h == r.h);
    }

    toString(): string {
        return JSON.stringify(this.toJSON());
    }

    toJSON(): any {
        return {
            x: this.x,
            y: this.y,
            w: this.w,
            h: this.h,
            r: this.r,
            b: this.b
        };
    }
}