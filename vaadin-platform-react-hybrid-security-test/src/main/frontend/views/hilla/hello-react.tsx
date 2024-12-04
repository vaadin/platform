import { VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";

export const config: ViewConfig = {
    menu: {
        title: "Hello World React",
    }
};

export default function User() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"HelloAnon"}>
            <span>Hello to everyone.</span>
        </VerticalLayout>
    );
}