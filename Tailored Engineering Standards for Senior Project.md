# 6.4.2 Stakeholder Needs and Requirements Definition process

## A. Prepare for Stakeholder Needs and Requirements Definition

### 1. Identify the stakeholders who have an interest in the software system throughout its lifecycle

A
XP emphasizes customer involvement. 
“The point of customer involvement is to reduce wasted effort by putting the people with the needs in direct contact with the people who can fill those needs.”

### 2. Define	the	stakeholder	needs	and	requirements	definition	strategy

D
XP focuses on clear communication of requirements and prioritizing them.
“Plan using units of customer-visible functionality.”

### 3. Identify	and	plan	for	the	necessary	enabling	systems	or	services	needed	to	support	stakeholder	needs	and	 requirements	definition. 

H
XP emphasizes simplicity and refinement of processes.Enabling systems aligns with continuous integration and automation.
“The build environment must be smoothly automated. The deployment tools must be automated, including the ability to roll out incrementally and roll back in case of failure.”

### 4. Obtain	or	acquire	access	to	the	enabling	systems	or	services	to	be	used.

H
XP promotes infrastructure for smooth development.
“The build environment must be smoothly automated. The deployment tools must be automated, including the ability to roll out incrementally and roll back in case of failure.”

## B.Define stakeholder needs.

### 1. Define	context	of	use	within	the	concept	of	operations	and	the	preliminary	life	cycle	concepts. 

B
XP likes understanding the operational environment through customer collaboration.
“Defects are addressed in XP by many of the practices: pair programming, continuous integration, sitting together, real customer involvement, and daily deployment, for example.”

### 2. Identify stakeholder needs.

D
In XP, user stories are central to understanding stakeholder needs.
“Plan using units of customer-visible functionality. "Handle five times the traffic with the same response time." "Provide a two-click way for users to dial frequently used numbers." As soon as a story is written, try to estimate the development effort necessary to implement it.”

### 3. Prioritize and down-select needs.

E
In XP, the customer prioritizes which stories they want.
“Have the customers pick a week's worth of stories to implement this week.”

### 4. Define the stakeholder needs and rationale.

D and G
In XP, the dialogue with the customer helps clarify the needs and rationale.
“Defects are addressed in XP by many of the practices: pair programming, continuous integration, sitting together, real customer involvement, and daily deployment, for example.”

## C. Develop the operational concept and other life cycle concepts.

### 1. Define a representative set of scenarios to identify the required capabilities that correspond to anticipated operational and other life cycle concepts.

B D
In XP, scenarios are analyzed through user stories and customer feedback
“User stories are short descriptions of functionality told from the perspective of the user”

### 2. Identify the factors affecting interactions between users and the system.

B D F
XP has things like usability, environmental constraints, and user capabilities affecting interactions. 
“Synchronous builds also create positive pressure for a short, clear feedback cycle. When I get notified of a problem half an hour after starting a new task; I waste a lot of time remembering what I was doing, fixing the problem, and then finding my place in the interrupted task.”



## D. Develop the operational concept and other life cycle concepts.

### 1.  Identify	the	constraints	on	a	system	solution

B
In XP, the use of user stories can help define scenarios and capabilities.

### 2.  Identify	the	stakeholder	requirements	and	functions	that	relate	to	critical	quality	characteristics,	such	as	 assurance,	safety,	security,	environment,	or	health. 

D F
In XP, critical quality characteristics, such as assurance, safety, security, and environment, are addressed through continuous customer feedback, traceability, automated testing, and regular iteration review.
“The principles listed here are not the only possible principles to guide software development. In the development of safety-critical systems, for example, the principle of traceability is at work.”



### 3. Define Stakeholder Requirements, Consistent with Life Cycle Concepts, Scenarios, Interactions, Constraints, and Critical Quality Characteristics

E F I
In XP, defining and refining stakeholder requirements is integral to the process, and is often done via user stories
“User stories are short descriptions of functionality told from the perspective of the user”

## E. Analyze Stakeholder Requirements

### 1. Analyze the complete set of stakeholder requirements.

E F
XP emphasizes simplicity and clarity in requirements, with brevity in user stories
“User stories are brief descriptions of functionality told from the perspective of a user.”

### 2. Define critical performance measures that enable the assessment of technical achievement.

F
In XP, testing and feedback loops provide a basis for tracking.
“Some of our customers are great. They write good stories. They write acceptance test criteria. They help testers write acceptance tests.”

### 3. Feed back the analyzed requirements to applicable stakeholders to validate that their needs and expectations have been adequately captured and expressed.

G
XP promotes regular customer feedback to review requirements
“ A programmer out of sync with the deployed software risks making decisions without getting accurate feedback about those decisions.”

### 4. Resolve stakeholder requirements issues.
G I
XP uses planning poker to resolve requirement issues and create priorities

## F. Manage the Stakeholder Needs and Requirements Definition

### 1. Obtain explicit agreement with designated stakeholders on the stakeholder requirements.

G
In XP collaboration and customer involvement are essential for agreement.
“Try the same in software development. Figure out how many stories the customer needs each week. Strive to improve development until some of the team members are idle; then you're ready to shrink the team and continue”

### 2. Maintain traceability of stakeholder needs and requirements.


I
In XP, we minimize documentation but maintain traceability. User stories give a clear trail.
“User stories are short descriptions of functionality told from the perspective of the user”

### 3. Provide key artifacts and information items that have been selected for baselines.

I
XP uses stories for documentation.
You can get close, though. This week's stories can become next week's documentation tasks, putting the completion of the documentation one week behind the completion of the stories.



# 6.4.5 Design Definition process
## Prepare for software system design definition.
### Define the design definition strategy, consistent with the selected life cycle model and anticipated design artifacts.
a. f \
b. XP says to design just enough up front: "Some design up-front is necessary, but just enough to get the initial implementation." XP says incremental design is the way to go, design should only be done as needed.

### Select and prioritize design principles and design characteristics.
a. a \
b. XP says to prioritze design principles needed for the development about to happen: "The advice to XP teams is not to minimize design investment over the short run, but to keep the design investment in proportion to the needs of the system so far"
### Identify and plan for the necessary enabling systems or services needed to support design definition.
a. c \
b. Again, XP would say to only do this if the enabling systems are immediately needed. "Strive to make the design of the system an excellent fit for the needs of the system that day. When your understanding of the best possible design leaps forward, work gradually but persistently to bring the design back into alignment with your understanding." Identify the systems when they become needed and adjust the design to encorporate them then.
### Obtain or acquire access to the enabling systems or services to be used.
a. c \
b. This is the same as the last one, obtain the services when they become needed.
## Establish designs related to each software system element.
### Transform architectural and design characteristics into the design of software system elements.
a. a \
b. Only design software elements needed up front: "Some design up-front is necessary, but just enough to get the initial implementation. Further design takes place once the implementation is in place and the real constraints on the design are obvious"
### Define and prepare or obtain the necessary design enablers.
a. g \
b. XP says not to do this, design alternatives should be considered as they are come across: "When your understanding of the best possible design leaps forward, work gradually but persistently to bring the design back into alignment with your understanding."
### Examine design alternatives and feasibility of implementation.
a. e \
b. XP says not to do this, design alternatives should be considered as they are come across: "When your understanding of the best possible design leaps forward, work gradually but persistently to bring the design back into alignment with your understanding."
### Refine or define the interfaces among the software system elements and with external entities.
a. d \
b. XP says this should only be done when it comes time to create connections with the external entities.
### Establish the design artifacts.
a. f \
b. As with before, design artifacts in XP should only be established when they come up in development.
## Assess alternatives for obtaining software system elements.
### Determine technologies required for each element composing the software system.
a. b \
b. "Some design up-front is necessary, but just enough to get the initial implementation.": XP says to determine the technologies needed for the initial system and worry about the rest as it becomes necessary.
### Identify candidate alternatives for the software system elements.
a. e \
b. As with before, XP says alternatives should only be considered when needed.
### Assess each candidate alternative against criteria developed from expected design characteristics and element requirements to determine suitability for the intended application.
a. e \
b. As with before, XP says alternatives should only be considered when needed.
### Choose the preferred alternatives among candidate design solutions for the software system elements.
a. e \
b. As with before, XP says alternatives should only be considered when needed.
## Manage the design.
### Capture the design and rationale.
a. h \
b. XP says not to directly maintain documentation of the design: "Maintain only the code and the tests as permanent artifacts. Generate other documents from the code and tests." 
### Establish traceability between the detailed design elements, the system/software requirements, and the architectural entities of the software system architecture.
a. h \
b. Because of incremental design, XP considers this traceability temporary: "When we create new, more beneficial relationships between elements, we can spread these relationships to all existing elements." Design elements and relationships will be changed throughout development, so traceability will change and should not be maintained as an artifact.
### Determine the status of the software system and element design.
a. h \
b. XP says this should be a daily activity, "Invest in the design of the system every day. Strive to make the design of the system an excellent fit for the needs of the system that day. When your understanding of the
best possible design leaps forward, work gradually but persistently to bring the design back into alignment with your understanding." Team members should be paying attention to the design to consider changes daily.
### Provide key artifacts and information items that have been selected for baselines.
a. g \
b. As with before, XP says permenant artifacts outside of the code and tests should not be maintained.
