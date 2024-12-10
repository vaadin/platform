import {Button, VerticalLayout} from "@vaadin/react-components";
import type { ViewConfig } from "@vaadin/hilla-file-router/types.js";
import {useNavigate} from "react-router";

export const config: ViewConfig = {
    menu: {
        title: "root",
    },
    flowLayout: false
};

/**
 * Hilla view that is available publicly.
 */
export default function Public() {
    const navigate = useNavigate();

    return (
        <VerticalLayout theme="padding">
            <p>This is the Hill index page.</p>
            <Button onClick={(e) => navigate("hilla")}>Hilla root</Button>
            <Button onClick={(e) => navigate("flow")}>Flow root</Button>
        </VerticalLayout>
    );
}
