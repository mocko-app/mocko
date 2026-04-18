export type DataValue = unknown;

export type DataField = DataValue[];

export type DataEntry = Record<string, DataField>;

export type Data = Record<string, DataEntry>;
