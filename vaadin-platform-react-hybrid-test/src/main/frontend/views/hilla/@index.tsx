import type {ViewConfig} from "@vaadin/hilla-file-router/types.js";

export const config: ViewConfig = {
    menu: {
        exclude: true,
        title: "ERROR!",
    },
};

export default function Hilla() {
    return (
        <div>
            <span id={"hilla"} hidden={true}></span>
            <div>"Hilla root view for menu!"</div>
        </div>
    );
}