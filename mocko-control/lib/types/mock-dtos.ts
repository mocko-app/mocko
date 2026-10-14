import { annotationsWithConflict } from "@/lib/conflict/conflicts";
import type {
  ConflictDto,
  ConflictOrigin,
  ConflictRole,
} from "@/lib/types/conflict-dtos";
import type {
  DisplayMockAnnotation,
  HttpMethod,
  Mock,
  MockResponse,
} from "@/lib/types/mock";

export type MockFailure = {
  message: string;
  date: string;
};

export type MockConflictRole = ConflictRole;

export type MockSummaryDto = {
  id: string;
  name: string;
  method: HttpMethod;
  path: string;
  host?: string;
  filePath?: string;
  source: ConflictOrigin;
};

export type MockConflictDto = ConflictDto<MockSummaryDto>;

export type CreateMockDto = {
  name: string;
  method: HttpMethod;
  path: string;
  host?: string | null;
  format?: string;
  labels?: string[];
  response: MockResponse;
};

export type PatchMockDto = {
  name?: string;
  method?: HttpMethod;
  path?: string;
  host?: string | null;
  format?: string;
  labels?: string[];
  response?: MockResponse;
  isEnabled?: boolean;
};

export class MockResponseDto {
  private constructor(
    public readonly code: number,
    public readonly delay: number | undefined,
    public readonly body: string | undefined,
    public readonly headers: Record<string, string>,
  ) {}

  static ofResponse(response: MockResponse): MockResponseDto {
    return new MockResponseDto(response.code, response.delay, response.body, {
      ...response.headers,
    });
  }
}

export class MockDto {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly method: Mock["method"],
    public readonly path: string,
    public readonly host: string | undefined,
    public readonly filePath: string | undefined,
    public readonly format: string | undefined,
    public readonly isEnabled: boolean,
    public readonly labels: string[],
    public readonly annotations: DisplayMockAnnotation[],
  ) {}

  static ofMock(mock: Mock, conflictRole?: MockConflictRole): MockDto {
    return new MockDto(
      mock.id,
      mock.name,
      mock.method,
      mock.path,
      mock.host,
      mock.filePath,
      mock.format,
      mock.isEnabled,
      [...mock.labels],
      annotationsWithConflict(mock.annotations, conflictRole),
    );
  }
}

export class MockDetailsDto {
  private constructor(
    public readonly id: string,
    public readonly name: string,
    public readonly method: Mock["method"],
    public readonly path: string,
    public readonly host: string | undefined,
    public readonly filePath: string | undefined,
    public readonly format: string | undefined,
    public readonly isEnabled: boolean,
    public readonly labels: string[],
    public readonly annotations: DisplayMockAnnotation[],
    public readonly response: MockResponseDto,
    public readonly failure: MockFailure | null,
    public readonly conflict: MockConflictDto | null,
  ) {}

  static ofMock(
    mock: Mock,
    failure: MockFailure | null = null,
    conflict: MockConflictDto | null = null,
  ): MockDetailsDto {
    return new MockDetailsDto(
      mock.id,
      mock.name,
      mock.method,
      mock.path,
      mock.host,
      mock.filePath,
      mock.format,
      mock.isEnabled,
      [...mock.labels],
      annotationsWithConflict(mock.annotations, conflict?.role),
      MockResponseDto.ofResponse(mock.response),
      failure,
      conflict,
    );
  }
}
