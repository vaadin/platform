import { Button, TextField, VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";
import { Notification } from '@vaadin/react-components/Notification.js';

export const config: ViewConfig = {
    menu: {
        title: "Hello React NO Flow Layout",
    },
    title: "Hilla outside Flow",
    flowLayout: false,
};

export default function HelloHilla() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"no-flow-hilla"}>
            <TextField label="Your name for Hilla" onValueChanged={(e) => setName(e.detail.value)} />
            <Button onClick = {() => Notification.show(`Hello ${name}` , {
                position: 'middle',
            })}> Say hello </Button>
        </VerticalLayout>
    );
}
