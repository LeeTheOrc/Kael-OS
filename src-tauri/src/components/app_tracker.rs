// src-tauri/src/components/app_tracker.rs
#![allow(dead_code)]

use crate::state::{AppProject, AppStatus};
use dioxus::prelude::*;

#[derive(Props, Clone, PartialEq)]
pub struct AppTrackerProps {
    pub projects: Vec<AppProject>,
}

#[allow(non_snake_case)]
pub fn AppTracker(props: AppTrackerProps) -> Element {
    let making = props
        .projects
        .iter()
        .filter(|p| p.status == AppStatus::Making)
        .collect::<Vec<_>>();
    let want = props
        .projects
        .iter()
        .filter(|p| p.status == AppStatus::Want)
        .collect::<Vec<_>>();
    let testing = props
        .projects
        .iter()
        .filter(|p| p.status == AppStatus::Testing)
        .collect::<Vec<_>>();

    let making_count = making.len();
    let want_count = want.len();
    let testing_count = testing.len();

    rsx! {
        div {
            style: "margin-top: 16px;",
            h3 {
                style: "color: #ffcc00; letter-spacing: 0.02em; margin-bottom: 12px; font-size: 14px; font-weight: 700;",
                "APP PROJECTS"
            }

            // Making Apps
            if !making.is_empty() {
                div {
                    style: "margin-bottom: 12px;",
                    div {
                        style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;",
                        div {
                            style: "width: 6px; height: 6px; border-radius: 50%; background: #e040fb;",
                        }
                        span {
                            style: "font-size: 12px; color: #e040fb; font-weight: 600; text-transform: uppercase;",
                            "Making ({making_count})"
                        }
                    }
                    for project in making.iter() {
                        div {
                            style: "padding: 8px 10px; background: rgba(224, 64, 251, 0.1); border: 1px solid #e040fb; border-radius: 8px; margin-bottom: 6px;",
                            div {
                                style: "color: #f7f2ff; font-size: 12px; font-weight: 600;",
                                "{project.name}"
                            }
                            div {
                                style: "color: #cbd5ff; font-size: 11px; margin-top: 2px;",
                                "{project.description}"
                            }
                            div {
                                style: "color: #a99ec3; font-size: 10px; margin-top: 4px;",
                                "v",
                                "{project.version}"
                            }
                        }
                    }
                }
            }

            // Want to Make Apps
            if !want.is_empty() {
                div {
                    style: "margin-bottom: 12px;",
                    div {
                        style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;",
                        div {
                            style: "width: 6px; height: 6px; border-radius: 50%; background: #ffcc00;",
                        }
                        span {
                            style: "font-size: 12px; color: #ffcc00; font-weight: 600; text-transform: uppercase;",
                            "Want to Make ({want_count})"
                        }
                    }
                    for project in want.iter() {
                        div {
                            style: "padding: 8px 10px; background: rgba(255, 204, 0, 0.1); border: 1px solid #ffcc00; border-radius: 8px; margin-bottom: 6px;",
                            div {
                                style: "color: #f7f2ff; font-size: 12px; font-weight: 600;",
                                "{project.name}"
                            }
                            div {
                                style: "color: #cbd5ff; font-size: 11px; margin-top: 2px;",
                                "{project.description}"
                            }
                        }
                    }
                }
            }

            // Testing Apps
            if !testing.is_empty() {
                div {
                    style: "display: flex; align-items: center; gap: 8px; margin-bottom: 8px;",
                    div {
                        style: "width: 6px; height: 6px; border-radius: 50%; background: #7aebbe;",
                    }
                    span {
                        style: "font-size: 12px; color: #7aebbe; font-weight: 600; text-transform: uppercase;",
                        "Testing ({testing_count})"
                    }
                }
                for project in testing.iter() {
                    div {
                        style: "padding: 8px 10px; background: rgba(122, 238, 190, 0.1); border: 1px solid #7aebbe; border-radius: 8px; margin-bottom: 6px;",
                        div {
                            style: "color: #f7f2ff; font-size: 12px; font-weight: 600;",
                            "{project.name}"
                        }
                        div {
                            style: "color: #cbd5ff; font-size: 11px; margin-top: 2px;",
                            "{project.description}"
                        }
                        div {
                            style: "color: #a99ec3; font-size: 10px; margin-top: 4px;",
                            "v",
                            "{project.version}"
                        }
                    }
                }
            }

            if making.is_empty() && want.is_empty() && testing.is_empty() {
                div {
                    style: "padding: 12px; text-align: center; color: #a99ec3; font-size: 12px; background: rgba(58, 45, 86, 0.2); border-radius: 8px; border: 1px solid #3a2d56;",
                    "No apps yet. Scaffold one to get started →"
                }
            }
        }
    }
}
