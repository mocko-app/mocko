type Mapping = (text: string) => string;

export abstract class IColumn {
    public abstract hasText: boolean;
    protected abstract build(iterator: IterableIterator<any>): string;
    private readonly mappings: Mapping[] = [];

    public accept(iterator: IterableIterator<any>): string {
        let text = this.build(iterator);

        this.mappings.forEach(mapping => text = mapping(text));

        return text;
    }

    public color(color: Mapping): IColumn {
        this.mappings.push(color);
        return this;
    }
}

export abstract class ISimpleColumn extends IColumn {
    public readonly hasText = false;
    protected abstract _build(): string;

    protected build(_iterator: IterableIterator<any>): string {
        return this._build();
    }
}

export abstract class ITextColumn extends IColumn {
    public readonly hasText = true;
    protected abstract _build(text: string): string;
    protected build(iterator: IterableIterator<any>): string {
        const text = iterator.next().value.toString();
        return this._build(text);
    }
}
