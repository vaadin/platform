import { Button, TextField, VerticalLayout } from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import { useState } from "react";
import { Notification } from '@vaadin/react-components/Notification.js';

export const config: ViewConfig = {
    menu: {
        title: "Hello World React",
    }
};

export default function HelloReact() {
    const [name, setName] = useState("");

    return (
        <VerticalLayout theme="padding" id={"HelloReact"}>
            <TextField label="Your name" onValueChanged={(e) => setName(e.detail.value)} />
            <Button onClick = {() => Notification.show(`Hello ${name}` , {
                position: 'middle',
                duration: 0,
            })}> Say hello </Button>
        </VerticalLayout>
    );
}