/*
  # Seed Demo User Account and Sample Proposal (v2)

  ## Summary
  Creates the demo user account (Alex Tan, Senior Policy Officer) and populates a
  realistic nearly-complete proposal with all 6 sections pre-filled so the tutorial
  has meaningful content to showcase. Also seeds a sample open event.

  ## Notes
  - Uses ON CONFLICT DO NOTHING guards throughout
  - Idempotent: safe to run multiple times
*/

DO $$
DECLARE
  v_demo_user_id uuid;
  v_event_id uuid;
  v_proposal_id uuid;
BEGIN

  -- Create auth user if not exists
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'demo@productcoach.app') THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role,
      aud
    ) VALUES (
      gen_random_uuid(),
      '00000000-0000-0000-0000-000000000000',
      'demo@productcoach.app',
      crypt('DemoUser2024!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- Get the demo user id
  SELECT id INTO v_demo_user_id FROM auth.users WHERE email = 'demo@productcoach.app';

  -- Create profile if not exists
  INSERT INTO profiles (id, full_name, role, roles, organization, job_title, is_demo)
  VALUES (
    v_demo_user_id,
    'Alex Tan',
    'officer',
    ARRAY['officer']::text[],
    'Ministry of Manpower',
    'Senior Policy Officer',
    true
  )
  ON CONFLICT (id) DO UPDATE SET is_demo = true;

  -- Create a sample open event if not already there
  IF NOT EXISTS (SELECT 1 FROM events WHERE title = 'GovTech Innovation Challenge 2026') THEN
    INSERT INTO events (id, title, description, status, start_date, end_date, created_by)
    VALUES (
      gen_random_uuid(),
      'GovTech Innovation Challenge 2026',
      'Submit proposals that leverage technology to improve public service delivery. Open to all public officers across ministries and statutory boards.',
      'open',
      '2026-01-15',
      '2026-06-30',
      v_demo_user_id
    )
    RETURNING id INTO v_event_id;
  ELSE
    SELECT id INTO v_event_id FROM events WHERE title = 'GovTech Innovation Challenge 2026';
  END IF;

  -- Add demo user as event organiser owner (if not already)
  INSERT INTO event_organisers (event_id, organiser_id, role)
  VALUES (v_event_id, v_demo_user_id, 'owner')
  ON CONFLICT DO NOTHING;

  -- Delete existing demo proposals so we can re-create clean
  DELETE FROM proposals WHERE user_id = v_demo_user_id;

  -- Create the demo proposal
  INSERT INTO proposals (
    id,
    user_id,
    event_id,
    title,
    problem_statement,
    solution_overview,
    status,
    quality_score,
    current_step
  ) VALUES (
    gen_random_uuid(),
    v_demo_user_id,
    v_event_id,
    'Digital Leave Management System',
    'Staff manually process 200+ leave requests per week using paper forms, causing 3-day average delays and significant administrative burden.',
    'An integrated digital leave management platform that automates request routing, approvals, and record-keeping, reducing processing time from 3 days to under 2 hours.',
    'draft',
    0,
    1
  )
  RETURNING id INTO v_proposal_id;

  -- Section 1: Problem Identification
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'problem_identification',
    '{
      "title": "Digital Leave Management System",
      "problemStatement": "Staff across 4 departments manually process over 200 leave requests per week using paper forms and email chains. This results in an average 3-day processing delay, frequent data entry errors, and significant time lost by both officers and HR administrators. During peak periods (school holidays), the backlog grows to over 500 pending requests.",
      "affectedUsers": "Approximately 120 frontline officers across the HR, Finance, Operations, and Policy departments, plus 8 HR administrators who process all requests manually. Department heads are also impacted as they cannot get real-time visibility into team leave coverage.",
      "currentImpact": "An estimated 15 staff-hours are lost per week to manual processing. HR administrators spend 40% of their time on leave administration instead of strategic HR work. Errors in leave records have led to 3 payroll discrepancies in the past quarter, requiring audit and correction. Staff satisfaction scores for HR services dropped 12 points year-on-year."
    }',
    true,
    false
  );

  -- Section 2: Problem Validation
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'problem_validation',
    '{
      "evidenceOfProblem": "A staff survey conducted in November 2025 (n=98 respondents, 82% response rate) showed that 76% of officers rated the current leave process as inefficient or very inefficient. HR administrators reported spending an average of 2.5 hours daily on leave-related administration. An audit of Q3 2025 found 23 instances where leave records did not match payroll records.",
      "frequencyAndScale": "The problem occurs continuously throughout the year, with peak impact during school holiday periods (June, September, December). On average, 210 leave requests are submitted weekly. During peak periods this rises to 520 per week. The issue has been documented in the Annual HR Operations Review for the past 3 consecutive years.",
      "existingAttempts": "In 2023, the team attempted to streamline the process using a shared Excel workbook, but this created version control issues and was abandoned after 2 months. A commercial HR software evaluation was conducted in 2024 but was not approved due to data residency concerns. This proposal seeks to build an in-house solution using the agency approved GCC infrastructure."
    }',
    true,
    false
  );

  -- Section 3: User Research
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'user_research',
    '{
      "researchMethods": "Three research methods were used: (1) Staff survey with 98 respondents across all affected departments; (2) Five in-depth interviews with HR administrators and department heads; (3) Process observation — shadowing HR staff for 2 days to map the end-to-end leave processing workflow and identify bottlenecks.",
      "keyFindings": "Key findings: Officers want a mobile-friendly self-service portal to submit and check leave status without visiting HR. HR administrators need a single dashboard showing all pending requests. Department heads want automated alerts when team leave coverage drops below a threshold. All stakeholders want an integration with the existing payroll system to eliminate the manual reconciliation step.",
      "userNeeds": "Primary needs: (1) Submit leave requests from any device in under 2 minutes; (2) Receive automated acknowledgement and status updates via email; (3) Department heads approve with a single click from their inbox; (4) HR dashboard with real-time queue visibility; (5) Automatic payroll system sync upon approval; (6) Audit trail for compliance and dispute resolution."
    }',
    true,
    false
  );

  -- Section 4: Opportunity Framing
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'opportunity_framing',
    '{
      "opportunityStatement": "By digitising and automating the leave management process, we have the opportunity to reclaim 15 staff-hours per week, eliminate payroll errors, and significantly improve the HR service experience for 120 officers. This project also positions the agency as a model for digital HR transformation across the ministry cluster.",
      "potentialSolutions": "Three solution options were considered: (Option A) Off-the-shelf SaaS HR platform rejected due to data residency requirements. (Option B) Customise existing workflow with Power Automate — partially addresses the problem but does not integrate with payroll. (Option C) Build a lightweight in-house web application on GCC infrastructure with payroll API integration — recommended.",
      "recommendedApproach": "Recommended: In-house web application on GCC. The solution will include a self-service officer portal, a manager approval interface, an HR administrator dashboard, and a REST API integration with the HR payroll system. Development in two sprints: MVP in 3 months covering core leave request flow, and full feature set in 6 months including analytics and payroll integration."
    }',
    true,
    false
  );

  -- Section 5: Success Definition
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'success_definition',
    '{
      "successCriteria": "The project will be considered successful if, within 6 months of go-live: (1) Average leave processing time reduces from 3 days to under 4 hours; (2) HR administrator time spent on leave administration reduces by at least 60%; (3) Zero payroll discrepancies attributable to leave record errors; (4) Staff satisfaction score for HR leave services improves by at least 15 points on the annual survey; (5) System adoption rate exceeds 90% of eligible staff within 2 months of launch.",
      "measurableOutcomes": "Quantitative KPIs: Processing time per request (target: under 4 hours, measured via system timestamps); Weekly HR admin hours on leave processing (target: under 5 hours, down from 12); Payroll discrepancy count (target: 0 per quarter); Staff satisfaction NPS for HR services (target: +15 points); System adoption rate (target: over 90% within 8 weeks).",
      "evaluationPlan": "Progress will be tracked via a monthly dashboard reviewed by the HR Director and project sponsor. A formal post-implementation review will be conducted at the 3-month and 6-month marks. Staff surveys will be administered at 1 month and 6 months post-launch. System usage analytics will be reviewed weekly by the project team during the first 3 months."
    }',
    true,
    false
  );

  -- Section 6: Executive Summary (not yet completed — tutorial shows this as the final step)
  INSERT INTO proposal_sections (proposal_id, section_type, content, completed, ai_generated)
  VALUES (
    v_proposal_id,
    'executive_summary',
    '{
      "executiveSummary": "",
      "keyBenefits": "",
      "implementationTimeline": "",
      "resourceRequirements": ""
    }',
    false,
    false
  );

  -- Save snapshots for Reset Demo feature
  DELETE FROM demo_proposal_snapshots WHERE demo_user_id = v_demo_user_id;

  INSERT INTO demo_proposal_snapshots (demo_user_id, proposal_id, section_type, content, completed)
  SELECT v_demo_user_id, proposal_id, section_type, content, completed
  FROM proposal_sections
  WHERE proposal_id = v_proposal_id;

END $$;
