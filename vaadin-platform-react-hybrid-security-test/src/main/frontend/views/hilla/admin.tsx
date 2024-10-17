import { VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";

export const config: ViewConfig = {
    menu: {
        title: "Hello Admin",
    },
    loginRequired: true,
    rolesAllowed: ['ROLE_ADMIN'],
};

export default function HelloReact() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"HelloAdmin"}>
            <span>Hello ADMIN of the system.</span>
        </VerticalLayout>
    );
}