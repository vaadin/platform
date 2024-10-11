import {
    AppLayout,
    DrawerToggle,
    Icon,
    SideNav,
    SideNavItem
} from "@vaadin/react-components";
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { createMenuItems, useViewConfig } from '@vaadin/hilla-file-router/runtime.js';
import { effect, Signal, signal } from "@vaadin/hilla-react-signals";

const vaadin = window.Vaadin as {
    documentTitleSignal: Signal<string>;
};
vaadin.documentTitleSignal = signal("");
effect(() => { document.title = vaadin.documentTitleSignal.value; });

export default function Layout() {
    const navigate = useNavigate();
    const location = useLocation();
    vaadin.documentTitleSignal.value = useViewConfig()?.title ?? '';


    return (
        <AppLayout primarySection="drawer">
            <div slot="drawer" className="flex flex-col justify-between h-full p-m">
                <header className="flex flex-col gap-m">
                    <h1 className="text-l m-0">Hybrid Example With Stateful Auth</h1>
                    <SideNav
                        onNavigate={({ path }) => navigate(path!)}
                        location={location}>
                        {
                            createMenuItems().filter(({to}) => {
                                 console.log("+++", to);
                                return to.startsWith("hilla") || to.startsWith("/hilla");
                            }).map(({ to, icon, title }) => (
                                <SideNavItem path={to} key={to}>
                                    {icon && <Icon icon={icon} slot="prefix"/>}
                                    {title}
                                </SideNavItem>
                            ))
                        }
                    </SideNav>
                </header>

            </div>

            <DrawerToggle slot="navbar" aria-label="Menu toggle"></DrawerToggle>
            <h2 slot="navbar" className="text-l m-0">
                {vaadin.documentTitleSignal}
            </h2>

            <Outlet />
        </AppLayout>
    );
}
