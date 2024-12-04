import { Button, TextField, VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";
import { Notification } from '@vaadin/react-components/Notification.js';

export const config: ViewConfig = {
    menu: {
        title: "Not a match for layout",
    },
    title: "React in Flow Layout Deep Tree not a match"
};

export default function HelloHilla() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"flow-hilla-deep-tree-not-match"}>
            <TextField label="Your name" onValueChanged={(e) => setName(e.detail.value)} />
            <Button onClick = {() => Notification.show(`Hello ${name}` , {
                position: 'middle',
            })}> Say hello </Button>
        </VerticalLayout>
    );
}
