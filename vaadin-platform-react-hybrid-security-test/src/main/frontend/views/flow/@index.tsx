import type {ViewConfig} from "@vaadin/hilla-file-router/types.js";

export const config: ViewConfig = {
    menu: {
        exclude: true,
        title: "ERROR!",
    },
};

export default function HelloHilla() {
    return (
        <div>
            <div>Place holder! This will render flow route as a flow layout will be requested!</div>
            <div>Also tests Hilla menu exclude feature!</div>
        </div>
    );
}