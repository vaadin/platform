// Goals:
// - entrypoint for collecting modules and for compilation
// - dynamic import wrapped in exported fuction prevents executing side-effects early
// - eager import, bundled in main chunk
export async function main() {
  return import( /* webpackMode: 'eager' */ '@vaadin/vaadin');
}