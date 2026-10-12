# Foma-doro! Study Planner

A small, framework-free study planner with a separate About homepage, daily session planner, Pomodoro timer, task list, and monthly school calendar with personal events.

## Run

Open `index.html` in a browser. No install or build step is needed.

## Accounts and Sync

Account sync uses Supabase Auth and a Supabase database. To enable it:

1. Create a Supabase project and run `supabase-schema.sql` in its SQL Editor.
2. Copy the Project URL and the public anon/publishable key into `supabase-config.js`.
3. Enable email/password sign-in in Supabase Authentication. Set the site's deployed URL and allowed redirect URLs in the Supabase URL configuration.
4. Deploy the website to an HTTPS host. Sign-in and cross-device sync do not work when opening the page as a `file://` URL.

The browser uses only the public anon/publishable key; never put a service-role key in this site. Row-level security in the SQL schema limits calendar events and study days to their owning account. On a user's first sign-in on each device, existing local calendar events and study days are imported into their account. Tasks and daily session settings remain local to the browser.

## Features

- Set a daily focus goal on its own tab with Go Easy (2), Find Your Flow (4), Go Big (6), or a custom 1-8 session count. Nothing is selected until the user chooses a goal and presses Set Now!.
- Track completed sessions from the navigation bar; the Pomodoro timer stays locked until a daily goal is set.
- Build a weekly study streak by completing at least one focus session each day.
- Focus and break timer presets: 25/5 and 50/10, with pause, reset, and automatic break transitions.
- School year 2026-2027 calendar.
- In guest mode, calendar events, tasks, and study streaks stay in this browser.
- When Supabase is configured and a user is signed in, personal calendar events and weekly study streaks sync across devices.
- Add, complete, prioritize, and delete goals.
- Responsive layout with keyboard focus styles and reduced-motion support.