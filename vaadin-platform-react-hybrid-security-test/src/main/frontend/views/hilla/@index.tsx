import type {ViewConfig} from "@vaadin/hilla-file-router/types.js";
import { NavLink } from "react-router";

export const config: ViewConfig = {
    menu: {
        exclude: true,
        title: "ERROR!",
    },
};

export default function Hilla() {
    return (
        <div>
            <span id={"hilla-index"} hidden={true}></span>
            <div>"Hilla root view for menu!"</div>
            <NavLink to={"/hilla/hello-react"} id={"toHello"}>To hello react</NavLink>
        </div>
    );
}