<script setup>
import { usePublicProjectDetailsStore } from '@/stores/PublicProjectDetailsStore.js'
import Tooltip from '@/components/main/Tooltip.vue'
const projectStore = usePublicProjectDetailsStore()
</script>

<template>
  <div>
    <h3>Members</h3>

    <table class="table table-bordered table-striped">
      <thead>
        <tr>
          <th scope="col">Member Name</th>
          <th scope="col">Taxa <Tooltip content="Taxa added to project by this member"></Tooltip></th>
          <th scope="col">Specimens <Tooltip content="Specimens added to project by this member"></Tooltip></th>
          <th scope="col">Media <Tooltip content="Media added to the project by this member (these may be used in cells or characters by other members of the project)"></Tooltip></th>
          <th scope="col">Media Notes</th>
          <th scope="col">Chars <Tooltip content="Characters added to the project by this project member (these may be edited by other members of the project)"></Tooltip></th>
          <th scope="col">Char Notes</th>
          <th scope="col">Char Media <Tooltip content="This is the number of media that this project member added to characters or states (whether he or she loaded the media into the project or not)."></Tooltip></th>
          <th scope="col">Char Labels</th>
          <th scope="col">Cell Scorings (scored, NPA, "-")</th>
          <th scope="col">Cell Notes</th>
          <th scope="col">Cell Media</th>
          <th scope="col">Cell Labels</th>
          <th scope="col">Rules <Tooltip content="Rules of character relationship that this project member specified. Please see manual for further details."></Tooltip></th>
        </tr>
      </thead>
      <tbody>
        <tr :key="idx" v-for="(member, idx) in projectStore.overview.members">
          <td scope="row">
            <div class="fw-bold">{{ member.fname + ' ' + member.lname }}</div>

            <small v-if="member.administrator == '1'" class="text-danger"
              >Project Administrator <Tooltip content="can edit everything, maintains project information and membership, controls publication of project"></Tooltip></small
            >

            <div v-else-if="member.membership_status == '1'">
              <small v-if="member.member_role == '0'">
                Full membership <Tooltip content="can edit everything"></Tooltip></small
              >
              <small v-else-if="member.member_role == '1'"> Observer <Tooltip content="cannot edit"></Tooltip></small>
              <small v-else-if="member.member_role == '2'">
                Character annotater <Tooltip content="can edit everything but characters and states"></Tooltip></small
              >
              <small v-else-if="member.member_role == '3'">
                Bibliography maintainer <Tooltip content="can edit bibliography only"></Tooltip></small
              >
              <small v-else-if="member.member_role == '4'">
                Prior member <Tooltip content="no current access to this project"></Tooltip></small
              >
            </div>
          </td>
          <td>{{ member.taxa }}</td>
          <td>{{ member.specimens }}</td>
          <td>{{ member.media }}</td>
          <td>{{ member.media_notes }}</td>
          <td>{{ member.characters }}</td>
          <td>{{ member.character_notes }}</td>
          <td>{{ member.character_media }}</td>
          <td>{{ member.character_media_labels }}</td>
          <td>
            {{ member.cell_scorings }}<br />
            ({{ member.cell_scorings_scored }}, {{ member.cell_scorings_npa }},
            {{ member.cell_scorings_not }})
          </td>
          <td>{{ member.cell_notes }}</td>
          <td>{{ member.cell_media }}</td>
          <td>{{ member.cell_media_labels }}</td>
          <td>{{ member.rules }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>
