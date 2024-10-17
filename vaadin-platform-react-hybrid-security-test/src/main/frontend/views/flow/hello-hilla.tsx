import { VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";

export const config: ViewConfig = {
    menu: {
        title: "Hello React in Flow Layout",
    },
    title: "Hilla in Flow",
    loginRequired: true,
    rolesAllowed: [ "ROLE_USER", "ROLE_ADMIN" ]
};

export default function HelloHilla() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"flow-hilla-login"}>
           <span>Hilla in Flow Layout with USER/ADMIN login required!</span>
        </VerticalLayout>
    )
        ;
}