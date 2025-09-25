import { TezxContextMessage } from "../../../utils/ai/contextManager.js";

export type StatusType = 'success' | 'failed';

export type ChatSuggestionType = ({
    type: "chat",
    from: "support" | "user",
    suggestions?: {
        label: string;
        intent: string;
        response: string;
    }[],
    my_id?: string
    payload?: {
        status: StatusType;
        id: string,
        role: 'user' | 'support';
        content: string,
        attachment: string[],
        fullname?: string;
        avatar_url?: string;
        username?: any;
        isAgent?: boolean;
    }
})
export type SuggestionArrayType = {
    label: string;
    intent: string;
    response: string;
}
export type ConnectType = {
    type: "connect",
    chat: TezxContextMessage[],
    suggestions: SuggestionArrayType[] | undefined,
    my_id: string | undefined
};



interface Field {
    type: string;
    tagType: "input" | "textarea" | "select" | "radio" | "checkbox"
    name: string;
    label: string;
    required: boolean;
    errorMessage?: string;
    pattern?: string;
    multiple?: boolean,
    value?: [], // it is select/radio/checkbox
    patternMessage?: string;
}

export interface FormType {
    title: string;
    submitFailedMessage?: string;
    onsubmit: {
        method: string,
        action: string
    };
    successMessage: string,
    errorMessage: string,
    subtitle: string;
    fields: Field[];
}

export type FormInputType = {
    type: 'form-input';
    from: string;
    payload: {
        form: FormType;
        response: string;
    } | undefined;
    suggestions: SuggestionArrayType[] | undefined;
    my_id: string;
}
export type SuggestionTypeProps = ConnectType | ChatSuggestionType | FormInputType

export function suggestionChatSend(ws: WebSocket | undefined, props: SuggestionTypeProps) {
    ws?.send(JSON.stringify({
        ...props
    }));
}


export type TypingBlurredType = {
    type: 'typing' | "blurred";
    payload: {
        is_typing: boolean;
        info?: Record<string, string> | undefined;
    };
}

export function typingBlurred(ws: WebSocket | undefined, props: TypingBlurredType) {
    ws?.send(JSON.stringify({
        ...props
    }))
}


