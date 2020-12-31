import { ITextColumn } from "./column";

export enum TextAlignment {
    LEFT, RIGHT
}

export class TextColumn extends ITextColumn {
    private alignment = TextAlignment.LEFT;
    private textSize  = 0;

    public   left(): TextColumn { this.alignment = TextAlignment.LEFT;   return this; }
    public  right(): TextColumn { this.alignment = TextAlignment.RIGHT;  return this; }

    public size(size: number): TextColumn {
        this.textSize = size;
        return this;
    }

    protected _build(text: string): string {
        if(this.alignment === TextAlignment.LEFT) {
            return text.trim().padEnd(this.textSize);
        }

        if(this.alignment === TextAlignment.RIGHT) {
            return text.trim().padStart(this.textSize);
        }
    }
}
