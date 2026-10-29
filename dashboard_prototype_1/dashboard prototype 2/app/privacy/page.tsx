'use client'

import Topbar from '@/components/dashboard/Topbar'
import Link from 'next/link'

export default function PrivacyPage() {
  return (
    <main className="dashboard" id="main-content">
      <Topbar />
      <div className="privacy-content">
        <h1>Privacy Policy</h1>
        <p>
          <strong>Effective Date:</strong> [Effective Date]<br />
          <strong>Last Updated:</strong> [Last Updated Date]<br />
          <strong>Website:</strong> [Website URL]<br />
          <strong>Operator:</strong> [Operator Legal Name]
        </p>

        <h2>1. Introduction</h2>
        <p>INDRA — India&apos;s National Disaster &amp; Risk Analytics is a public-facing disaster intelligence platform designed to support awareness and analysis of disaster-related events and risks across India.</p>
        <p>This Privacy Policy explains how information is collected from relevant sources, processed, stored, displayed, and otherwise handled in connection with the INDRA platform. It also describes the principles governing data minimisation, information security, retention, disclosure, and privacy-related enquiries.</p>
        <p>The platform is intended to make relevant disaster information accessible to the public, emergency responders, and government officials. Privacy and responsible information handling are important considerations in the operation of the platform.</p>
        <p>By accessing the website, users can review publicly available disaster-related information and associated analytical outputs. This policy should be read alongside any applicable notices presented on the website.</p>

        <h2>2. Scope</h2>
        <p>This policy applies to the INDRA website and its associated disaster-information processing activities covered by the platform.</p>
        <p>It addresses information obtained from official sources, permitted public information sources, structured incident records, and technical information associated with website operation.</p>
        <p>This policy does not automatically govern third-party websites, social media platforms, external services, or websites accessible through links provided by INDRA. Those services may have their own privacy policies, terms, and data-handling practices.</p>

        <h2>3. Information Sources and Categories</h2>
        <p>Depending on the platform&apos;s enabled data sources and operational configuration, information handled by INDRA may include the following categories.</p>

        <h3>3.1 Official Weather and Disaster Information</h3>
        <p>Information from relevant official or otherwise authorised sources may include weather conditions, warnings, rainfall information, disaster alerts, geographical information, and other disaster-related indicators.</p>
        <p>The availability and permitted use of such information depend on the relevant source, applicable terms, and operational configuration.</p>

        <h3>3.2 Publicly Available Social Media Information</h3>
        <p>Where permitted sources and interfaces are used, publicly available social media information may be processed to identify potential disaster-related events and extract relevant incident information.</p>
        <p>Public availability does not automatically grant unrestricted rights to collect, retain, reproduce, or redistribute information. Processing remains subject to applicable laws, platform terms, access permissions, and other relevant restrictions.</p>

        <h3>3.3 Structured Incident Information</h3>
        <p>Information displayed or retained as part of an incident record may include:</p>
        <ul>
          <li>Incident or event category.</li>
          <li>Reported event location, district, or geographical coordinates.</li>
          <li>Reported event time.</li>
          <li>Severity classification, where available.</li>
          <li>Analytical confidence scores.</li>
          <li>Relevant validated disaster indicators.</li>
        </ul>
        <p>The exact fields depend on the information available and the platform&apos;s processing configuration.</p>

        <h3>3.4 Technical Information</h3>
        <p>Information generated through website operation may include technical logs, timestamps, request information, browser-related details, security events, and diagnostic information.</p>
        <p>The specific information collected depends on the hosting environment, infrastructure, security configuration, and any analytics or monitoring services in use.</p>

        <h2>4. Purposes of Processing</h2>
        <p>Information may be processed for legitimate disaster-information and platform-operation purposes, including:</p>
        <ul>
          <li>Identifying and categorising potential disaster-related events.</li>
          <li>Associating incidents with reported geographical locations.</li>
          <li>Supporting disaster awareness and situational understanding.</li>
          <li>Generating structured incident records and analytical indicators.</li>
          <li>Presenting relevant information through the public dashboard.</li>
          <li>Maintaining website functionality and reliability.</li>
          <li>Detecting, investigating, and addressing technical faults or security incidents.</li>
          <li>Meeting applicable legal and regulatory requirements.</li>
        </ul>
        <p>Information should be limited to what is reasonably necessary for the relevant purpose, subject to applicable legal obligations and operational requirements.</p>

        <h2>5. Social Media Processing and Data Minimisation</h2>
        <p>INDRA is intended to minimise the retention and public disclosure of personal information obtained through social media sources.</p>
        <p>Where social media information is processed to identify potential disaster-related incidents, the intended processing approach is to extract relevant disaster-related fields and avoid retaining the original source response beyond the processing stage.</p>
        <p>The intended design is to process original source responses in memory, extract the necessary incident information, and discard the original responses after processing. This approach must be supported by the actual implementation, including its handling of queues, caches, logs, error traces, and backups.</p>
        <p>Retained structured incident records are intended to exclude unnecessary personal identifiers and source-specific information, including:</p>
        <ul>
          <li>Social media usernames and account identifiers.</li>
          <li>Profile links and original post URLs.</li>
          <li>Original social media post text.</li>
          <li>Personal location information associated with the post author.</li>
          <li>Unrelated personal or identifying details.</li>
        </ul>
        <p>The location associated with a retained incident should represent the reported event location, rather than the personal location of the individual who posted the information.</p>
        <p>These data-minimisation principles do not eliminate the possibility that personal information could be encountered during processing. Any such handling must be assessed against applicable law, permitted purposes, and the platform&apos;s actual technical controls.</p>

        <h2>6. Public Dashboard and Disclosure</h2>
        <p>INDRA provides a publicly accessible dashboard intended to present structured disaster-related information.</p>
        <p>The public display is intended to focus on relevant incident information and analytical indicators rather than reproducing original social media posts or disclosing unnecessary personal information.</p>
        <p>Information displayed may include incident categories, reported event locations, event times, severity classifications, confidence scores, and relevant validated disaster indicators, depending on availability.</p>
        <p>Public access to the dashboard does not mean that every underlying source record, internal processing artefact, or technical log is publicly accessible.</p>
        <p>Information may be disclosed where necessary for platform operation, security, applicable legal obligations, or other lawful purposes. Any such disclosure should be limited to what is appropriate for the relevant purpose.</p>

        <h2>7. Automated Analysis and Information Reliability</h2>
        <p>INDRA may use automated processing and analytical methods to identify, classify, or assess potential disaster-related events.</p>
        <p>Automated outputs may contain errors, incomplete information, inaccurate geographical associations, duplicate incidents, or incorrect classifications. Confidence scores and severity classifications should not be interpreted as guarantees of factual accuracy.</p>
        <p>Information obtained from public sources may be unverified, outdated, misleading, or later contradicted by authoritative sources. The presence of an incident on the dashboard should not, by itself, be treated as confirmation that the incident has been officially verified.</p>
        <p>Users should consult relevant official authorities and authoritative emergency communications when making decisions involving personal safety, evacuation, medical assistance, or emergency response.</p>
        <p>INDRA is intended to support disaster awareness and analysis. It should not be treated as a substitute for official warnings, emergency instructions, or professional judgement.</p>

        <h2>8. Data Storage, Retention, and Deletion</h2>
        <p>Information should be retained only for as long as necessary for the relevant operational purpose, subject to applicable legal requirements, security obligations, and legitimate recordkeeping needs.</p>
        <p>Different categories of information may require different retention arrangements, including:</p>
        <ul>
          <li><b>Structured incident records.</b></li>
          <li><b>Original source responses processed during incident extraction.</b></li>
          <li><b>Technical, diagnostic, and security logs.</b></li>
          <li><b>Backups and disaster-recovery records.</b></li>
          <li><b>Information associated with future optional features, if introduced.</b></li>
        </ul>
        <p>The intended approach is to discard original social media source responses after processing and retain only the necessary structured incident information. This approach must be verified against the actual processing pipeline and storage configuration before publication.</p>
        <p>Specific retention periods and deletion procedures must be established for the relevant information categories. They should account for operational needs, applicable legal requirements, and any obligations relating to security logs or records.</p>
        <p>Where information is scheduled for deletion, the procedure should also account for copies in backups, caches, or other systems, where applicable and technically feasible.</p>

        <h2>9. Security Measures</h2>
        <p>Appropriate technical and organisational safeguards should be used to protect information handled by INDRA against unauthorised access, disclosure, alteration, loss, or misuse.</p>
        <p>Depending on the deployed architecture and identified risks, relevant safeguards may include access controls, secure configuration, protected communications, restricted access to operational systems, monitoring, backups, and incident-response procedures.</p>
        <p>The specific safeguards in place depend on the actual implementation and operating environment. No security measure can guarantee that a website or information system will be completely secure.</p>
        <p>Any statements about particular security controls, certifications, audits, or technical protections should accurately reflect measures that have actually been implemented.</p>

        <h2>10. Third-Party Services and Information Sharing</h2>
        <p>INDRA may depend on external services for permitted data access, hosting, infrastructure, security, monitoring, or other operational functions.</p>
        <p>The services used and the information they process depend on the deployed configuration. Relevant third-party providers may handle information under their own contractual terms, privacy policies, and applicable legal obligations.</p>
        <p>Information may also be disclosed where required by law, pursuant to a valid legal process, or where reasonably necessary to address security incidents or protect the platform or its users, subject to applicable law.</p>
        <p>The platform should not share personal information with third parties merely because that information is publicly available. Any sharing should have an appropriate purpose and lawful basis.</p>
        <p>Specific provider names, data-processing arrangements, and applicable terms should be identified accurately where required.</p>

        <h2>11. Cookies, Analytics, and Website Logs</h2>
        <p>The website&apos;s use of cookies, browser storage, analytics, and technical logs depends on the actual production configuration.</p>
        <p>Essential technical storage may be used where necessary for website functionality or security. Analytics or other optional tracking technologies, if deployed, should be described accurately, including the categories of information involved and any available user controls.</p>
        <p>Website hosting and infrastructure may generate technical logs for operational monitoring, troubleshooting, and security. These logs are distinct from the structured disaster incident records presented on the dashboard.</p>
        <p>In production deployments, this application includes Vercel Analytics (<code>@vercel/analytics/next</code>), which is rendered only when the application is running in a production environment. Vercel Analytics may process usage information as part of its analytics service. The specific information collected and how it is processed are governed by Vercel&apos;s applicable documentation and policies.</p>
        <p>The actual cookie configuration, analytics providers, log contents, and applicable retention arrangements must be established before this policy is published. This policy does not imply that a particular analytics product or tracking technology is in use unless that has been confirmed.</p>

        <h2>12. Alerts, Subscriptions, and Communication Features</h2>
        <p>The availability of alerts, subscriptions, or other communication features depends on the platform&apos;s deployed functionality.</p>
        <p>If such features are introduced, the relevant notice should explain what information is collected, why it is needed, how it is used, and how long it is retained.</p>
        <p>For example, a future alert-subscription service that uses telephone numbers or email addresses would require appropriate information about those details and their use. Such collection should not be implied unless the feature is actually available.</p>
        <h2>13. Privacy Rights and Grievances</h2>
        <p>Individuals who believe that their personal information has been handled inappropriately in connection with INDRA may contact the designated privacy or grievance contact using the details below.</p>
        <p><strong>Privacy / Grievance Contact</strong></p>
        <ul>
          <li><strong>Responsible entity:</strong> [Operator Legal Name]</li>
          <li><strong>Contact person or designated officer:</strong> [Privacy or Grievance Contact Name]</li>
          <li><strong>Email:</strong> [Privacy or Grievance Contact Email]</li>
          <li><strong>Postal address:</strong> [Official Contact Address]</li>
          <li><strong>Telephone:</strong> [Contact Number, if applicable]</li>
        </ul>
        <p>Requests and complaints will be handled in accordance with applicable law and the procedures established by the platform operator.</p>
        <p>Depending on the circumstances and applicable legal requirements, individuals may be able to request information about relevant processing, raise concerns, seek correction or deletion where applicable, or exercise other available rights.</p>
        <p>The availability and scope of particular rights depend on the applicable law, the nature of the information, and the circumstances of the request.</p>
        <h2>14. Applicable Laws and Regulatory Requirements</h2>
        <p>INDRA's information-handling activities are subject to applicable Indian laws and regulations, as relevant to the platform, its operator, and the specific processing activities.</p>
        <p>Potentially relevant legal frameworks include the Digital Personal Data Protection Act, 2023, and applicable provisions of the Digital Personal Data Protection Rules, 2025, as they come into force; the Information Technology Act, 2000; and applicable cybersecurity directions and requirements.</p>
        <p>The applicability of individual provisions depends on their commencement status, the nature of the operator, the activities performed, and the circumstances involved. Other requirements may apply depending on the platform's data sources, service providers, and operational arrangements.</p>
        <p>Where applicable, the platform operator will address relevant legal obligations concerning personal information, cybersecurity, incident reporting, recordkeeping, and grievance handling.</p>
        <p>References to laws in this policy do not, by themselves, constitute a representation that the platform complies with every requirement of those laws. The operator must assess and meet the obligations applicable to its actual activities.</p>

        <h2>15. Children's Information</h2>
        <p>INDRA is a publicly accessible disaster-information platform and is not intended to require children to provide personal information to view the public dashboard.</p>
        <p>The platform should avoid intentionally collecting or retaining unnecessary personal information about children through its disaster-information processing activities.</p>
        <p>If personal information relating to a child is encountered or processed, its handling must be assessed in accordance with applicable law and the circumstances involved.</p>
        <p>Any future feature designed to collect information directly from users, including children, should have appropriate privacy safeguards and notices before being introduced.</p>

        <h2>16. Changes to This Policy</h2>
        <p>This Privacy Policy may be updated to reflect changes in the platform's functionality, data sources, technical configuration, legal obligations, or information-handling practices.</p>
        <p>The latest version should be published on this page with an updated revision date. Where required by applicable law, material changes should be communicated through appropriate means.</p>
        <p>Users are encouraged to review this page periodically to understand the current policy.</p>
        <p>A policy update should accurately describe the platform's actual practices and should not be used as a substitute for implementing required privacy or security safeguards.</p>

        <h2>17. Contact</h2>
        <p>For questions about this Privacy Policy or privacy-related concerns, contact the platform operator using the details below.</p>
        <p><strong>INDRA — India's National Disaster &amp; Risk Analytics</strong></p>
        <ul>
          <li><strong>Operator:</strong> [Operator Legal Name]</li>
          <li><strong>Website:</strong> [Website URL]</li>
          <li><strong>Privacy Contact:</strong> [Privacy Contact Email]</li>
          <li><strong>Postal Address:</strong> [Official Contact Address]</li>
        </ul>
        <p>Please include enough information to explain the nature of your enquiry, but avoid sending unnecessary sensitive personal information.</p>
        <p><strong>Effective Date:</strong> [Effective Date]<br />
        <strong>Last Updated:</strong> [Last Updated Date]</p>
      </div>
      <footer>
        <Link href="/" className="footer-link">Back to Dashboard</Link>
        <span>
          India&apos;s National Disaster &amp; Risk Analytics <b>◆</b>
        </span>
      </footer>
    </main>
  )
}