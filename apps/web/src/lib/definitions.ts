export type ErrorState = {
  errors?: {
    title?: string[];
    description?: string[];
  };
  message?: string | null;
};

export type MasterPageErrorState = {
  errors?: {
    notionMasterPageId?: string[];
  };
  message?: string | null;
};
