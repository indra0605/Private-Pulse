import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export enum SurveyState { DRAFT = 0, OPEN = 1, CLOSED = 2 }

export type Witnesses<PS> = {
}

export type ImpureCircuits<PS> = {
  openSurvey(context: __compactRuntime.CircuitContext<PS>, _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeSurvey(context: __compactRuntime.CircuitContext<PS>,
              _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 _secret_0: Uint8Array,
                 _response_0: Uint8Array,
                 _responseSalt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveParticipation(context: __compactRuntime.CircuitContext<PS>,
                     _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type ProvableCircuits<PS> = {
  openSurvey(context: __compactRuntime.CircuitContext<PS>, _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeSurvey(context: __compactRuntime.CircuitContext<PS>,
              _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 _secret_0: Uint8Array,
                 _response_0: Uint8Array,
                 _responseSalt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveParticipation(context: __compactRuntime.CircuitContext<PS>,
                     _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type PureCircuits = {
}

export type Circuits<PS> = {
  openSurvey(context: __compactRuntime.CircuitContext<PS>, _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  closeSurvey(context: __compactRuntime.CircuitContext<PS>,
              _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  submitResponse(context: __compactRuntime.CircuitContext<PS>,
                 _secret_0: Uint8Array,
                 _response_0: Uint8Array,
                 _responseSalt_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
  proveParticipation(context: __compactRuntime.CircuitContext<PS>,
                     _secret_0: Uint8Array): __compactRuntime.CircuitResults<PS, []>;
}

export type Ledger = {
  readonly organizer: Uint8Array;
  readonly surveyId: Uint8Array;
  readonly questionCount: bigint;
  readonly state: SurveyState;
  readonly participantCount: bigint;
  participants: {
    isEmpty(): boolean;
    size(): bigint;
    member(elem_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<Uint8Array>
  };
  responseCommitments: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export type ContractReferenceLocations = any;

export declare const contractReferenceLocations : ContractReferenceLocations;

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>,
               _secret_0: Uint8Array,
               _surveyId_0: Uint8Array,
               _questionCount_0: bigint): __compactRuntime.ConstructorResult<PS>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
