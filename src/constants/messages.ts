export const COMMON_MESSAGES = {
  VALIDATION_ERROR: 'Validation error'
}

export const AUTH_MESSAGES = {
  EMAIL_IS_INVALID: 'Email is invalid',
  EMAIL_ALREADY_EXISTS: 'Email already exists',
  PASSWORD_IS_REQUIRED: 'Password is required',
  PASSWORD_MUST_BE_STRING: 'Password must be a string',
  PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_50: 'Password length must be between 6 and 50 characters',
  PASSWORD_MUST_BE_STRONG:
    'Password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character',
  CONFIRM_PASSWORD_IS_REQUIRED: 'Confirm password is required',
  CONFIRM_PASSWORD_MUST_BE_STRING: 'Confirm password must be a string',
  CONFIRM_PASSWORD_LENGTH_MUST_BE_BETWEEN_6_AND_50: 'Confirm password length must be between 6 and 50 characters',
  CONFIRM_PASSWORD_MUST_BE_STRONG:
    'Confirm password must be 6-50 characters long and contain at least 1 lowercase letter, 1 uppercase letter, 1 number, and 1 special character',
  CONFIRM_PASSWORD_MUST_BE_THE_SAME_AS_PASSWORD: 'Confirm password must be the same as password',

  REGISTER_SUCCESS: 'Register successfully, please check your email to verify your account',

  EMAIL_OR_PASSWORD_IS_INCORRECT: 'Email or password is incorrect',

  LOGIN_SUCCESS: 'Login successfully',

  ACCESS_TOKEN_IS_REQUIRED: 'Access token is required',
  REFRESH_TOKEN_IS_REQUIRED: 'Refresh token is required',
  USED_REFRESH_TOKEN_OR_NOT_EXIST: 'Used refresh token or not exist',

  LOGOUT_SUCCESS: 'Logout successfully',

  REFRESH_TOKEN_SUCCESS: 'Refresh token successfully',

  EMAIL_VERIFY_TOKEN_IS_REQUIRED: 'Email verify token is required',
  USER_NOT_FOUND: 'User not found',
  EMAIL_ALREADY_VERIFIED_BEFORE: 'Email already verified before',

  EMAIL_VERIFY_SUCCESS: 'Email verify successfully',

  RESEND_EMAIL_VERIFY_SUCCESS: 'Resend email verify successfully, please check your email',

  CHECK_EMAIL_TO_RESET_PASSWORD: 'Check email to reset password',

  FORGOT_PASSWORD_TOKEN_IS_REQUIRED: 'Forgot password token is required',
  INVALID_FORGOT_PASSWORD_TOKEN: 'Invalid forgot password token',

  VERIFY_FORGOT_PASSWORD_SUCCESS: 'Verify forgot password successfully',

  RESET_PASSWORD_SUCCESS: 'Reset password successfully',

  GMAIL_NOT_VERIFIED: 'Gmail not verified'
}

export const USERS_MESSAGES = {
  GET_ME_SUCCESS: 'Get my profile successfully',

  USER_NOT_VERIFIED: 'User not verified, please verify your account',

  DISPLAY_NAME_IS_REQUIRED: 'Display name is required',
  DISPLAY_NAME_MUST_BE_STRING: 'Display name must be a string',
  DISPLAY_NAME_LENGTH_MUST_BE_BETWEEN_1_AND_100: 'Display name length must be between 1 and 100 characters',

  IMAGE_URL_MUST_BE_STRING: 'Image url must be a string',
  IMAGE_URL_LENGTH_MUST_BE_BETWEEN_1_AND_400: 'Image url length must be between 1 and 400 characters',

  UPDATE_ME_SUCCESS: 'Update my profile successfully',

  USER_NOT_FOUND: 'User not found',
  OLD_PASSWORD_NOT_MATCH: 'Old password not match',

  CHANGE_PASSWORD_SUCCESS: 'Change password successfully, please login again'
}

export const WORKSPACES_MESSAGES = {
  WORKSPACE_TITLE_IS_REQUIRED: 'Workspace title is required',
  WORKSPACE_TITLE_MUST_BE_STRING: 'Workspace title must be a string',
  WORKSPACE_TITLE_LENGTH_MUST_BE_BETWEEN_1_AND_50: 'Workspace title length must be between 1 and 50 characters',
  WORKSPACE_DESCRIPTION_MUST_BE_STRING: 'Workspace description must be a string',
  WORKSPACE_DESCRIPTION_LENGTH_MUST_BE_LESS_THAN_256: 'Workspace description length must be less than 256 characters',

  CREATE_WORKSPACE_SUCCESS: 'Workspace created successfully',

  INVALID_WORKSPACE_ID: 'Invalid workspace id',
  WORKSPACE_NOT_FOUND: 'Workspace not found',

  GET_WORKSPACE_SUCCESS: 'Get workspace successfully',

  GET_WORKSPACES_SUCCESS: 'Get workspaces successfully',

  WORKSPACE_TYPE_MUST_BE_PUBLIC_OR_PRIVATE: 'Workspace type must be "Public" or "Private"',
  WORKSPACE_LOGO_MUST_BE_STRING: 'Workspace logo must be a string',
  MEMBER_MUST_BE_OBJECT: 'Member must be an object',
  MEMBER_MISSING_REQUIRED_FIELDS: 'Member missing required fields',
  INVALID_MEMBER_ACTION: 'Invalid member action',
  WORKSPACE_ROLE_IS_REQUIRED: 'Workspace role is required',
  INVALID_WORKSPACE_ROLE: 'Invalid workspace role',
  INVALID_MEMBER_ID: 'Invalid member id',

  UPDATE_WORKSPACE_SUCCESS: 'Workspace updated successfully',

  DELETE_WORKSPACE_SUCCESS: 'Workspace deleted successfully',

  USER_NOT_MEMBER_OF_WORKSPACE: 'User is not a member of this workspace',
  INSUFFICIENT_WORKSPACE_PERMISSIONS: 'Insufficient permissions to access this workspace resource',
  WORKSPACE_ROLE_NOT_FOUND: 'Workspace role not found',
  CANNOT_REMOVE_LAST_WORKSPACE_ADMIN: 'Cannot remove the last admin from workspace. At least one admin must remain.',
  BOARD_ID_IS_REQUIRED: 'Board id is required for remove from board action',
  BOARD_NOT_FOUND: 'Board not found or does not belong to this workspace',
  USER_NOT_MEMBER_OF_BOARD: 'User is not a member of this board',
  CANNOT_REMOVE_LAST_BOARD_ADMIN: 'Cannot remove the last admin from board. At least one admin must remain.',

  GUEST_MUST_BE_OBJECT: 'Guest must be an object'
}

export const BOARDS_MESSAGES = {
  BOARD_TITLE_IS_REQUIRED: 'Board title is required',
  BOARD_TITLE_MUST_BE_STRING: 'Board title must be a string',
  BOARD_TITLE_LENGTH_MUST_BE_BETWEEN_1_AND_50: 'Board title length must be between 1 and 50 characters',
  BOARD_DESCRIPTION_MUST_BE_STRING: 'Board description must be a string',
  BOARD_DESCRIPTION_LENGTH_MUST_BE_LESS_THAN_256: 'Board description length must be less than 256 characters',
  BOARD_TYPE_MUST_BE_PUBLIC_OR_PRIVATE: 'Board type must be "Public" or "Private"',
  WORKSPACE_ID_IS_REQUIRED: 'Workspace id is required',
  WORKSPACE_ID_MUST_BE_STRING: 'Workspace id must be a string',
  INVALID_WORKSPACE_ID: 'Invalid workspace id',
  WORKSPACE_NOT_FOUND: 'Workspace not found',

  CREATE_BOARD_SUCCESS: 'Board created successfully',

  KEYWORD_MUST_BE_STRING: 'Keyword must be a string',

  GET_BOARDS_SUCCESS: 'Get boards successfully',

  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',

  GET_BOARD_SUCCESS: 'Get board successfully',

  COLUMN_ORDER_IDS_MUST_BE_AN_ARRAY: 'Column order ids must be an array of strings',
  COLUMN_ORDER_IDS_CANNOT_BE_EMPTY: 'Column order ids cannot be empty',
  COVER_PHOTO_MUST_BE_STRING: 'Cover photo must be a string',
  COVER_PHOTO_LENGTH_MUST_BE_BETWEEN_1_AND_400: 'Cover photo length must be between 1 and 400 characters',
  INVALID_COLUMN_ID: 'Invalid column id',

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

  CREATE_COLUMN_SUCCESS: 'Column created successfully',

  INVALID_COLUMN_ID: 'Invalid column id',
  COLUMN_NOT_FOUND: 'Column not found',
  COLUMN_NOT_BELONG_TO_USER: 'Column not belong to user',

  CARD_ORDER_IDS_MUST_BE_AN_ARRAY: 'Card order ids must be an array of strings',
  CARD_ORDER_IDS_CANNOT_BE_EMPTY: 'Card order ids cannot be empty',
  INVALID_CARD_ID: 'Invalid card id',

  UPDATE_COLUMN_SUCCESS: 'Column updated successfully',

  DELETE_COLUMN_SUCCESS: 'Column deleted successfully'
}

export const CARDS_MESSAGES = {
  CARD_TITLE_IS_REQUIRED: 'Card title is required',
  CARD_TITLE_MUST_BE_STRING: 'Card title must be a string',
  CARD_TITLE_LENGTH_MUST_BE_BETWEEN_3_AND_50: 'Card title length must be between 3 and 50 characters',
  CARD_DUE_DATE_MUST_BE_ISO8601: 'Card due date must be ISO8601 format',
  BOARD_ID_IS_REQUIRED: 'Board id is required',
  BOARD_ID_MUST_BE_STRING: 'Board id must be a string',
  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',
  COLUMN_ID_IS_REQUIRED: 'Column id is required',
  COLUMN_ID_MUST_BE_STRING: 'Column id must be a string',
  INVALID_COLUMN_ID: 'Invalid column id',
  COLUMN_NOT_FOUND: 'Column not found',

  CREATE_CARD_SUCCESS: 'Card created successfully',

  INVALID_CARD_ID: 'Invalid card id',
  CARD_NOT_FOUND: 'Card not found',
  CARD_NOT_BELONG_TO_USER: 'Card not belong to user',

  CARD_COMPLETION_STATUS_MUST_BE_BOOLEAN: 'Card completion status must be boolean',
  CARD_DESCRIPTION_MUST_BE_STRING: 'Card description must be a string',
  COVER_PHOTO_MUST_BE_STRING: 'Cover photo must be a string',
  COVER_PHOTO_LENGTH_MUST_BE_BETWEEN_1_AND_400: 'Cover photo length must be between 1 and 400 characters',
  CARD_ARCHIVE_STATUS_MUST_BE_BOOLEAN: 'Card archive status must be boolean',
  COMMENT_INVALID_USER_ID: 'Comment invalid user id',
  COMMENT_CONTENT_MUST_BE_STRING: 'Comment content must be a string',
  MEMBER_MUST_BE_OBJECT: 'Member must be an object',
  MEMBER_MISSING_REQUIRED_FIELDS: 'Member missing required fields',
  INVALID_MEMBER_ACTION: 'Invalid member action',
  INVALID_MEMBER_ID: 'Invalid member id',
  MEMBER_ALREADY_EXISTS: 'Member already exists',
  MEMBER_NOT_FOUND: 'Member not found',
  ATTACHMENT_FILE_MISSING_REQUIRED_FIELDS: 'Attachment file missing required fields',
  ATTACHMENT_LINK_MISSING_REQUIRED_FIELDS: 'Attachment link missing required fields',
  INVALID_COMMENT_ID: 'Invalid comment id',
  COMMENT_NOT_FOUND: 'Comment not found',
  ATTACHMENT_TYPE_MUST_BE_FILE_OR_LINK: 'Attachment type must be "FILE" or "LINK"',
  COMMENT_CONTENT_IS_REQUIRED: 'Comment content is required',
  ATTACHMENT_FILE_MUST_BE_OBJECT: 'Attachment file must be an object',
  ATTACHMENT_LINK_MUST_BE_OBJECT: 'Attachment link must be an object',
  ATTACHMENT_FILE_IS_REQUIRED: 'Attachment file is required',
  ATTACHMENT_LINK_IS_REQUIRED: 'Attachment link is required',
  INVALID_ATTACHMENT_ID: 'Invalid attachment id',
  ATTACHMENT_NOT_FOUND: 'Attachment not found',
  USER_ID_IS_REQUIRED: 'User id is required',
  USER_ID_MUST_BE_STRING: 'User id must be a string',
  INVALID_USER_ID: 'Invalid user id',
  USER_NOT_FOUND: 'User not found',

  CREATE_CARD_COMMENT_SUCCESS: 'Create card comment successfully',

  UPDATE_CARD_COMMENT_SUCCESS: 'Update card comment successfully',

  REMOVE_CARD_COMMENT_SUCCESS: 'Remove card comment successfully',

  ADD_CARD_ATTACHMENT_SUCCESS: 'Add card attachment successfully',

  UPDATE_CARD_ATTACHMENT_SUCCESS: 'Update card attachment successfully',

  REMOVE_ATTACHMENT_SUCCESS: 'Remove attachment successfully',

  ADD_CARD_MEMBER_SUCCESS: 'Add card member successfully',

  REMOVE_CARD_MEMBER_SUCCESS: 'Remove card member successfully',

  UPDATE_CARD_SUCCESS: 'Card updated successfully',

  REACTION_EMOJI_IS_REQUIRED: 'Reaction emoji is required',
  REACTION_EMOJI_MUST_BE_STRING_AND_1_2_CHARACTERS: 'Reaction emoji must be a string and 1 - 2 characters',
  REACTION_ACTION_IS_REQUIRED: 'Reaction action is required',
  REACTION_ACTION_MUST_BE_STRING: 'Reaction action must be a string',
  INVALID_REACTION_ACTION: 'Invalid reaction action',
  REACTION_ALREADY_EXISTS: 'Reaction already exists',
  REACTION_ID_IS_REQUIRED: 'Reaction id is required',
  INVALID_REACTION_ID: 'Invalid reaction id',
  REACTION_NOT_FOUND: 'Reaction not found',
  REACTION_ID_MUST_BE_STRING: 'Reaction id must be a string',

  REACT_CARD_COMMENT_SUCCESS: 'Reacted to card comment successfully',

  DELETE_CARD_SUCCESS: 'Card deleted successfully',

  CURRENT_CARD_ID_IS_REQUIRED: 'Current card id is required',
  CURRENT_CARD_ID_MUST_BE_STRING: 'Current card id must be a string',
  PREV_COLUMN_ID_IS_REQUIRED: 'Previous column id is required',
  PREV_COLUMN_ID_MUST_BE_STRING: 'Previous column id must be a string',
  PREV_CARD_ORDER_IDS_MUST_BE_AN_ARRAY: 'Previous card order ids must be an array of strings',
  PREV_CARD_ORDER_IDS_CANNOT_BE_EMPTY: 'Previous card order ids cannot be empty',
  NEXT_COLUMN_ID_IS_REQUIRED: 'Next column id is required',
  NEXT_COLUMN_ID_MUST_BE_STRING: 'Next column id must be a string',
  NEXT_CARD_ORDER_IDS_MUST_BE_AN_ARRAY: 'Next card order ids must be an array of strings',
  NEXT_CARD_ORDER_IDS_CANNOT_BE_EMPTY: 'Next card order ids cannot be empty',

  MOVE_CARD_TO_DIFFERENT_COLUMN_SUCCESS: 'Move card to different column successfully'
}

export const MEDIAS_MESSAGES = {
  UPLOAD_SUCCESS: 'Upload successfully',

  UNSPLASH_SEARCH_GET_PHOTOS_QUERY_IS_REQUIRED: 'Unsplash search get photos query is required',
  UNSPLASH_SEARCH_GET_PHOTOS_QUERY_MUST_BE_STRING: 'Unsplash search get photos query must be a string',

  UNSPLASH_SEARCH_GET_PHOTOS_SUCCESS: 'Unsplash search get photos successfully'
}

export const INVITATIONS_MESSAGES = {
  INVITEE_EMAIL_IS_INVALID: 'Invitee email is invalid',
  INVITEE_NOT_FOUND_OR_NOT_REGISTERED_AN_ACCOUNT: 'Invitee not found or not registered an account',
  BOARD_ID_IS_REQUIRED: 'Board id is required',
  BOARD_ID_MUST_BE_STRING: 'Board id must be a string',
  INVALID_BOARD_ID: 'Invalid board id',
  BOARD_NOT_FOUND: 'Board not found',
  USER_DOES_NOT_HAVE_ACCESS_TO_BOARD: 'User does not have access to board',
  WORKSPACE_ID_IS_REQUIRED: 'Workspace id is required',
  WORKSPACE_ID_MUST_BE_STRING: 'Workspace id must be a string',
  INVALID_WORKSPACE_ID: 'Invalid workspace id',
  WORKSPACE_NOT_FOUND: 'Workspace not found',
  USER_DOES_NOT_HAVE_ACCESS_TO_WORKSPACE: 'User does not have access to workspace',
  INVALID_BOARD_ROLE: 'Invalid board role',
  INVALID_WORKSPACE_ROLE: 'Invalid workspace role',

  CREATE_NEW_WORKSPACE_INVITATION_SUCCESS: 'User invited to workspace successfully',
  CREATE_NEW_BOARD_INVITATION_SUCCESS: 'User invited to board successfully',

  INVITE_TOKEN_IS_REQUIRED: 'Invite token is required',
  INVITER_NOT_FOUND: 'Inviter not found',
  INVALID_INVITE_TOKEN: 'Invalid invite token',

  VERIFY_INVITATION_SUCCESS: 'Verify invitation successfully',

  GET_INVITATIONS_SUCCESS: "Get user's invitations successfully",

  INVALID_WORKSPACE_INVITATION_STATUS: 'Workspace invitation status must be PENDING, ACCEPTED or REJECTED',

  INVALID_BOARD_INVITATION_STATUS: 'Board invitation status must be PENDING, ACCEPTED or REJECTED',
  USER_IS_ALREADY_MEMBER_OF_BOARD: 'User is already member of board',
  USER_IS_ALREADY_MEMBER_OF_WORKSPACE: 'User is already member of workspace',

  INVITATION_ID_IS_REQUIRED: 'Invitation id is required',
  INVITATION_ID_MUST_BE_STRING: 'Invitation id must be a string',
  INVALID_INVITATION_ID: 'Invalid invitation id',
  INVITATION_NOT_FOUND: 'Invitation not found',
  USER_DOES_NOT_HAVE_ACCESS_TO_INVITATION: 'User does not have access to this invitation',
  ONLY_INVITED_USER_CAN_ACCEPT_INVITATION: 'Only the invited user can accept this invitation',

  BOARD_INVITATION_ID_IS_REQUIRED: 'Board invitation id is required',
  BOARD_INVITATION_ID_MUST_BE_STRING: 'Board invitation id must be a string',
  INVALID_BOARD_INVITATION_ID: 'Invalid board invitation id',
  BOARD_INVITATION_NOT_FOUND: 'Board invitation not found',
  USER_DOES_NOT_HAVE_ACCESS_TO_BOARD_INVITATION: 'User does not have access to this board invitation',

  UPDATE_WORKSPACE_INVITATION_SUCCESS: 'Update workspace invitation successfully',

  UPDATE_BOARD_INVITATION_SUCCESS: 'Update board invitation successfully'
}
