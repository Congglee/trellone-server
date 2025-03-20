export const COMMON_MESSAGES = {
  VALIDATION_ERROR: 'Validation error'
}

export const BOARDS_MESSAGES = {
  BOARD_TITLE_IS_REQUIRED: 'Board title is required',
  BOARD_TITLE_MUST_BE_STRING: 'Board title must be a string',
  BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50: 'Board title length must be between 3 and 50 characters',
  BOARD_DESCRIPTION_MUST_BE_STRING: 'Board description must be a string',
  BOARD_DESCRIPTION_MUST_BE_BETWEEN_3_AND_256: 'Board description must be between 3 and 256 characters',
  BOARD_TYPE_MUST_BE_PUBLIC_OR_PRIVATE: 'Board type must be public or private',

  CREATE_BOARD_SUCCESS: 'Board created successfully',

  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',

  GET_BOARD_SUCCESS: 'Get board successfully',

  COLUMN_ORDER_IDS_MUST_BE_AN_ARRAY: 'Column order ids must be an array of strings',
  COLUMN_ORDER_IDS_CANNOT_BE_EMPTY: 'Column order ids cannot be empty',

  UPDATE_BOARD_SUCCESS: 'Board updated successfully'
}

export const COLUMNS_MESSAGES = {
  COLUMN_TITLE_IS_REQUIRED: 'Column title is required',
  COLUMN_TITLE_MUST_BE_STRING: 'Column title must be a string',
  COLUMN_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50: 'Column title length must be between 3 and 50 characters',
  BOARD_ID_IS_REQUIRED: 'Board id is required',
  BOARD_ID_MUST_BE_STRING: 'Board id must be a string',
  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',

  CREATE_COLUMN_SUCCESS: 'Column created successfully'
}

export const CARDS_MESSAGES = {
  CARD_TITLE_IS_REQUIRED: 'Card title is required',
  CARD_TITLE_MUST_BE_STRING: 'Card title must be a string',
  CARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50: 'Card title length must be between 3 and 50 characters',
  BOARD_ID_IS_REQUIRED: 'Board id is required',
  BOARD_ID_MUST_BE_STRING: 'Board id must be a string',
  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',
  COLUMN_ID_IS_REQUIRED: 'Column id is required',
  COLUMN_ID_MUST_BE_STRING: 'Column id must be a string',
  INVALID_COLUMN_ID: 'Invalid column id',
  COLUMN_NOT_FOUND: 'Column not found',

  CREATE_CARD_SUCCESS: 'Card created successfully'
}
