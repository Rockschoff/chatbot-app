import os
os.environ["SERPER_API_KEY"] = "52f2aca5f29aa39c41a42d2beb3262154537e365"
os.environ["OPENAI_API_KEY"] = "sk-proj-WUmVKyExE0ldlamujMT1T3BlbkFJUHsm9JbEZyJu0IjmW8Ps"

from crewai import Agent, Task, Crew, Process
from crewai_tools import SerperDevTool, BaseTool
from openai import OpenAI
client = OpenAI()
# Define the custom GPT-4 tool
class GPT4Tool(BaseTool):
    name: str = "GPT-4.0"
    description: str = "A tool to interact with GPT-4.0 for generating sophisticated language outputs."

    def _run(self, prompt: str) -> str:
        response = client.chat.completions.create(
            model="gpt-4o",  # Use the appropriate engine for GPT-4.0
            messages=[
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": prompt}
  ],
        )
        return response.choices[0].message.content

# Initialize the tools
search_tool = SerperDevTool()
gpt4_tool = GPT4Tool()

# Creating a senior researcher agent with memory and verbose mode
researcher = Agent(
  role='Researcher',
  goal='Provide in-depth, actionable insights on emerging trends in the FSQ industry.',
  verbose=False,
  memory=True,
  backstory=(
    "As a meticulous analyst with a knack for uncovering crucial details, you excel at"
    "delivering comprehensive and practical insights. Your work is driven by a deep understanding"
    "of the FSQ industry, enabling you to identify key trends and provide data-driven"
    "recommendations that empower business leaders to make informed decisions."
  ),
  tools=[search_tool, gpt4_tool],
  allow_delegation=False
)


# Creating a writer agent with custom tools and delegation capability
writer = Agent(
  role='Writer',
  goal='Craft compelling, detailed reports and articles that provide clear and practical advice for FSQ industry leaders.',
  verbose=True,
  memory=True,
  backstory=(
    "With a talent for transforming complex data into engaging narratives, you specialize in"
    "producing well-structured reports and articles. Your writings not only inform but also"
    "guide industry leaders in the FSQ sector, presenting multifaceted analyses and practical"
    "recommendations that drive strategic decisions."
    "Always give citations and technical deatils about the source of the information"
  ),
  tools=[search_tool, gpt4_tool],
  allow_delegation=False
)



# Research task
research_task = Task(
  description=(
    "Conduct a thorough analysis of emerging trends in the FSQ industry. Focus on identifying the pros and cons"
    "of each trend, its market opportunities, and potential risks. Your final report should clearly articulate"
    "these key points and provide actionable insights that can guide business decisions."
  ),
  expected_output='A detailed 3-paragraph report on the latest FSQ trends, including opportunities and risks.',
  tools=[search_tool, gpt4_tool],
  agent=researcher,
)


# Writing task with language model configuration
write_task = Task(
  description=(
    "Compose an insightful article on the latest advancements in the FSQ industry. Focus on how these trends"
    "are impacting the market, offering a balanced view with pros, cons, and practical advice for industry leaders."
    "Ensure the article is easy to understand, engaging, and provides clear, actionable recommendations."
  ),
  expected_output='A 4-paragraph article on FSQ advancements formatted as markdown, highlighting key trends and advice.',
  tools=[search_tool, gpt4_tool],
  agent=writer,
  async_execution=False,
  output_file='fsq-trends-article.md'
)


# Forming the tech-focused crew with some enhanced configurations
crew = Crew(
  agents=[researcher, writer],
  tasks=[research_task, write_task],
  process=Process.sequential,  # Optional: Sequential task execution is default
  memory=True,
  cache=True,
  max_rpm=100,
  share_crew=True
)

result = crew.kickoff(inputs={'text' : 'write me a Hazard Analysis Procedure for Sherbet Production'})
print(result)