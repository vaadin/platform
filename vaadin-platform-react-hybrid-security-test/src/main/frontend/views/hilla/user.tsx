import { Button, TextField, VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";
import { Notification } from '@vaadin/react-components/Notification.js';

export const config: ViewConfig = {
    menu: {
        title: "Hello User",
    },
    loginRequired: true,
    rolesAllowed: ['ROLE_USER'],
};

export default function HelloReact() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"HelloUser"}>
            <span>Hello USER of the system.</span>
        </VerticalLayout>
    );
}