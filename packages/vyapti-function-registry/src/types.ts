export type FunctionAttributeDefinition = {
    attribute_name: string;
    attribute_data_type: string;
    order: number;
    required?: boolean;
    default_value?: string | null;
    default_quote_render?: boolean;
};

export type FunctionReturnDefinition = {
    attribute_name: string;
    attribute_data_type: string;
    order: number;
};

export type FunctionDefinition = {
    function_name: string;
    function_description: string;
    function_attributes: FunctionAttributeDefinition[];
    function_returns: FunctionReturnDefinition[];
    is_async?: boolean;
};

export type RegisteredFunction = {
    definition: FunctionDefinition;
    execute: (args: Record<string, unknown>) => unknown;
};
